import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import Mic from 'wuf/svgs/mic.svg';
import StopCircle from 'wuf/svgs/stop-circle.svg';

function tapHaptic(style: ImpactStyle): void {
  Haptics.impact({ style }).catch(() => {
    // No haptics support (e.g. desktop browser) — silently skip
  });
}

export default class AudioCapturer extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  @tracked isRecording = false;
  @tracked isStarting = false;
  @tracked elapsedLabel = '0:00';
  @tracked micError?: string;

  mediaRecorder?: MediaRecorder;
  stream?: MediaStream;
  liveAudioContext?: AudioContext;
  liveAnalyser?: AnalyserNode;
  liveData?: Uint8Array<ArrayBuffer>;
  rafId?: number;
  startedAt = 0;
  level = 0;
  glowElement?: HTMLElement;

  trackGlow = modifier((element: HTMLElement) => {
    this.glowElement = element;
    return () => {
      this.glowElement = undefined;
    };
  });

  @action
  async toggleRecording() {
    if (this.isStarting) {
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    this.isStarting = true;
    this.micError = undefined;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException('getUserMedia unavailable', 'NotSupportedError');
      }

      const stream = await this.requestMicrophone();
      this.stream = stream;

      // Safari/WKWebView can't record audio/webm — fall back per platform
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      this.mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      this.mediaRecorder.addEventListener('dataavailable', (e) => {
        this.audioAnalyzer.uploadAudioVideo({
          blob: e.data,
        });
      });

      this.audioAnalyzer.beginLiveVisualization();
      this.startLiveVisualization(stream);

      this.mediaRecorder.start();
      this.startedAt = performance.now();
      this.elapsedLabel = '0:00';
      this.isRecording = true;
      tapHaptic(ImpactStyle.Medium);
    } catch (error) {
      this.stopLiveVisualization();
      this.micError = this.describeMicError(error);
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * getUserMedia with a timeout: some browsers (notably Safari/WebKit) can
   * leave the permission request pending indefinitely, which would otherwise
   * brick the button with no feedback. If permission is granted after we've
   * given up, release the stray stream so the mic indicator doesn't stick.
   */
  async requestMicrophone(): Promise<MediaStream> {
    const request = navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(
          new DOMException(
            'Timed out waiting for microphone permission',
            'TimeoutError',
          ),
        );
      }, 15000);
    });

    try {
      return await Promise.race([request, timeout]);
    } catch (error) {
      request
        .then((stream) => stream.getTracks().forEach((track) => track.stop()))
        .catch(() => {
          // The original request failed too — nothing to clean up
        });
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  describeMicError(error: unknown): string {
    if (error instanceof DOMException) {
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        // Chromium reports OS-level denial as "Permission denied by system"
        if (/system/i.test(error.message)) {
          return 'Your browser itself has no microphone access — enable it in System Settings → Privacy & Security → Microphone, then restart the browser.';
        }

        return "Microphone access is blocked for this site — set it to Allow (or Ask) in your browser's site settings, then reload.";
      }

      if (error.name === 'TimeoutError') {
        return "We never heard back about microphone access. Check your browser's permission prompt or site settings, then try again.";
      }

      if (error.name === 'NotFoundError') {
        return 'No microphone found on this device.';
      }
    }

    return "We couldn't reach your microphone on this device.";
  }

  @action
  stopRecording() {
    this.mediaRecorder?.stop();
    this.stopLiveVisualization();
    this.isRecording = false;
    tapHaptic(ImpactStyle.Light);
  }

  /**
   * Feeds live mic data into the rolling waveform and scales the button glow
   * with the (smoothed) input level on every animation frame.
   */
  startLiveVisualization(stream: MediaStream) {
    this.liveAudioContext = new AudioContext();
    const source = this.liveAudioContext.createMediaStreamSource(stream);
    this.liveAnalyser = this.liveAudioContext.createAnalyser();
    this.liveAnalyser.fftSize = 128;
    this.liveAnalyser.smoothingTimeConstant = 0.8;
    source.connect(this.liveAnalyser);
    this.liveData = new Uint8Array(this.liveAnalyser.fftSize);
    this.level = 0;

    const tick = () => {
      this.rafId = requestAnimationFrame(tick);

      this.liveAnalyser!.getByteTimeDomainData(this.liveData!);
      const extent = this.audioAnalyzer.pushLiveChunk(this.liveData!);

      // Smooth toward the current level so the glow breathes instead of flickering
      const target = Math.min(1, extent * 2.5);
      this.level += (target - this.level) * 0.25;
      this.glowElement?.style.setProperty('--level', this.level.toFixed(3));

      const seconds = Math.floor((performance.now() - this.startedAt) / 1000);
      const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      if (label !== this.elapsedLabel) {
        this.elapsedLabel = label;
      }
    };

    tick();
  }

  stopLiveVisualization() {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    void this.liveAudioContext?.close().catch(() => {
      // Already closed
    });
    this.liveAudioContext = undefined;
    this.liveAnalyser = undefined;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  willDestroy() {
    super.willDestroy();

    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.stopLiveVisualization();
  }

  <template>
    <div class="flex flex-col gap-4 items-center pb-4 pt-6">
      <div class="relative">
        {{#if this.isRecording}}
          <span class="record-glow" {{this.trackGlow}}></span>
          <span class="record-ripple motion-safe:animate-ripple"></span>
          <span
            class="record-ripple motion-safe:animate-ripple [animation-delay:0.6s]"
          ></span>
          <span
            class="record-ripple motion-safe:animate-ripple [animation-delay:1.2s]"
          ></span>
        {{/if}}

        <button
          class="record-btn {{if this.isRecording 'is-recording'}}"
          type="button"
          aria-label={{if this.isRecording "Stop recording" "Start recording"}}
          disabled={{this.isStarting}}
          data-recording="{{this.isRecording}}"
          data-test-record-button
          {{on "click" this.toggleRecording}}
        >
          {{#if this.isRecording}}
            <StopCircle
              class="motion-preset-pop"
              height="44"
              width="44"
              aria-hidden="true"
            />
          {{else}}
            <Mic
              class="motion-preset-pop"
              height="44"
              width="44"
              aria-hidden="true"
            />
          {{/if}}
        </button>
      </div>

      {{#if this.isRecording}}
        <p
          class="flex font-semibold gap-2 items-center text-white/80"
          aria-live="polite"
        >
          <span
            class="bg-record h-2 inline-block rounded-full w-2 motion-safe:animate-breathe"
          ></span>
          Listening
          <span class="tabular-nums" data-test-elapsed-time>
            {{this.elapsedLabel}}
          </span>
        </p>
      {{else if this.isStarting}}
        <p
          class="flex font-semibold gap-2 items-center text-white/80"
          aria-live="polite"
          data-test-mic-pending
        >
          <span
            class="bg-btn-hover h-2 inline-block rounded-full w-2 motion-safe:animate-breathe"
          ></span>
          Allow microphone access to continue…
        </p>
      {{else if this.micError}}
        <p
          class="font-medium max-w-xs motion-preset-shake text-center text-record text-sm"
          role="alert"
          data-test-mic-error
        >
          {{this.micError}}
        </p>
      {{else}}
        <p class="font-semibold text-white/60">
          Tap to listen
        </p>
      {{/if}}
    </div>
  </template>
}
