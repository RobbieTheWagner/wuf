import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isTesting, macroCondition } from '@embroider/macros';
import { animate } from 'motion';
import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkTonality,
  translateBark,
  getTimeDomainMaxMin,
  TONALITY_BINS,
} from 'wuf/utils/barks';
import type {
  BarkType,
  BarkTranslation,
  Pitch,
  Tonality,
} from 'wuf/utils/barks';

const barkDescriptions: Record<BarkType, string> = {
  alert:
    'Your dog may be alerting you to a potential problem or intruder nearby.',
  distress: 'Your dog may be in pain or scared.',
  greeting: 'Your dog is saying hello!',
  playful: 'Your dog wants to play!',
};

export type AnalysisOutcome = 'success' | 'no-barks' | 'error';

export interface WaveformChunk {
  /** Amplitude deviation from silence, normalized 0 (flat) to 1 (max) */
  extent: number;
  /** Whether this chunk crossed the bark threshold */
  bark: boolean;
}

const BAR_WIDTH = 3;
const BAR_STEP = 5; // bar width + gap
const MIN_BAR_HEIGHT = 2;
const WAVE_TEAL = 'oklch(75% 0.13 190)';
const WAVE_MINT = 'oklch(91% 0.17 172)';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Down-samples chunks so they fit the canvas as one bar per BAR_STEP px,
 * keeping the loudest extent (and any bark) from each group.
 */
function aggregateChunks(
  chunks: WaveformChunk[],
  maxBars: number,
): WaveformChunk[] {
  if (chunks.length <= maxBars) {
    return chunks;
  }

  const groupSize = Math.ceil(chunks.length / maxBars);
  const bars: WaveformChunk[] = [];

  for (let i = 0; i < chunks.length; i += groupSize) {
    const group = chunks.slice(i, i + groupSize);
    bars.push({
      extent: Math.max(...group.map((c) => c.extent)),
      bark: group.some((c) => c.bark),
    });
  }

  return bars;
}

export default class AudioAnalyzerService extends Service {
  @tracked barkType?: BarkType;
  @tracked barksOccurred: boolean[] = [];
  @tracked pitches: (Pitch | undefined)[] = [];
  @tracked tonalities: (Tonality | undefined)[] = [];

  /** Full acoustic read on the analyzed bout — set when analysis ends */
  @tracked translation?: BarkTranslation;

  /** True from upload/record handoff until the reveal sweep finishes */
  @tracked isAnalyzing = false;

  /** Set when analysis ends: did we find barks, none, or fail to decode? */
  @tracked outcome?: AnalysisOutcome;

  /** Bark count revealed so far — ticks up in sync with the waveform sweep */
  @tracked revealedBarkCount = 0;

  chunks: WaveformChunk[] = [];
  liveChunks: WaveformChunk[] = [];

  amplitudeArray?: Uint8Array<ArrayBuffer>;
  frequencyArray?: Uint8Array<ArrayBuffer>;
  audioContext?: AudioContext;
  sweepControls?: { stop: () => void };

  get barkDescription(): string | undefined {
    return this.barkType ? barkDescriptions[this.barkType] : undefined;
  }

  /** Number of distinct bark events (rising edges in barksOccurred) */
  get barkCount(): number {
    let count = 0;
    let previous = false;

    for (const bark of this.barksOccurred) {
      if (bark && !previous) {
        count++;
      }
      previous = bark;
    }

    return count;
  }

  /**
   * Analyze the audio data and provide visualizations
   * @param buffer The audio buffer containing our sound data
   */
  analyseAudio(buffer: AudioBuffer): void {
    // 44100 hz is the sample rate equivalent to CD audio
    const offline = new OfflineAudioContext(2, buffer.length, 44100);
    const bufferSource = offline.createBufferSource();
    bufferSource.onended = () => {
      this.revealAnalysis();
    };
    bufferSource.buffer = buffer;

    const analyser = offline.createAnalyser();
    // fftSize of 128 means we will have 64 for frequencyBinCount
    analyser.fftSize = 128;
    const scp = offline.createScriptProcessor(1024, 0, 1);

    bufferSource.connect(analyser);
    scp.connect(offline.destination); // this is necessary for the script processor to start

    this.amplitudeArray = new Uint8Array(analyser.frequencyBinCount);
    // The buckets of the array range from 0-22050 Hz, with each bucket representing ~345 Hz
    this.frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    scp.onaudioprocess = () => {
      analyser.getByteTimeDomainData(this.amplitudeArray!);
      analyser.getByteFrequencyData(this.frequencyArray!);

      // Since dog barks range from 250-4000 Hz, we should exclude any buckets above 4000 Hz
      // This means we only need the first 12 buckets, which should cover ~0-4140 Hz
      const dogRangeFrequencyArray = this.frequencyArray!.slice(0, 12);
      const pitch = determineBarkPitch(dogRangeFrequencyArray);
      // Tonality needs the noisy overtones above the fundamental, so it reads
      // a wider band than pitch does (see TONALITY_BINS).
      const tonality = determineBarkTonality(
        this.frequencyArray!.slice(0, TONALITY_BINS),
      );
      const barkOccurred = determineBarkOccurred(this.amplitudeArray!);

      this.barksOccurred.push(barkOccurred);
      this.pitches.push(pitch);
      this.tonalities.push(tonality);
      this.chunks.push({
        extent: this.getChunkExtent(this.amplitudeArray!),
        bark: barkOccurred,
      });
    };

    bufferSource.start(0);
    void offline.startRendering();
  }

  /**
   * Sweeps the analyzed waveform across the canvas, ticking the bark counter
   * as each bark scrolls past, then announces the verdict.
   */
  revealAnalysis(): void {
    const translation = translateBark(
      this.barksOccurred,
      this.pitches,
      this.tonalities,
    );
    const barkType = translation?.type;

    const finish = () => {
      this.revealedBarkCount = this.barkCount;
      this.drawAnalyzedWaveform(1);
      this.translation = translation;
      this.barkType = barkType;
      this.outcome = barkType ? 'success' : 'no-barks';
      this.isAnalyzing = false;
    };

    if (macroCondition(isTesting())) {
      // Keep tests deterministic — skip the sweep
      finish();
      return;
    }

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    this.sweepControls = animate(0, 1, {
      duration: 1.4,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (progress) => {
        this.drawAnalyzedWaveform(progress);
        this.revealedBarkCount = this.countBarksRevealed(progress);
      },
      onComplete: finish,
    });
  }

  /**
   * Resets the barkType, barksOccurred, and pitches for a fresh run
   */
  clearBarkData(): void {
    this.sweepControls?.stop();
    this.sweepControls = undefined;
    this.barkType = undefined;
    this.translation = undefined;
    this.barksOccurred = [];
    this.pitches = [];
    this.tonalities = [];
    this.chunks = [];
    this.liveChunks = [];
    this.revealedBarkCount = 0;
    this.isAnalyzing = false;
    this.outcome = undefined;
  }

  clearCanvas(): void {
    const sized = this.getSizedCanvas();
    sized?.ctx.clearRect(0, 0, sized.width, sized.height);
  }

  /**
   * Resets state ahead of live microphone visualization
   */
  beginLiveVisualization(): void {
    this.clearBarkData();
    this.clearCanvas();
  }

  /**
   * Appends a live microphone chunk and redraws the rolling waveform
   * @param amplitudeArray Time domain data for the current animation frame
   * @returns The chunk's amplitude extent (0..1), e.g. to drive a level meter
   */
  pushLiveChunk(amplitudeArray: ArrayLike<number>): number {
    const extent = this.getChunkExtent(amplitudeArray);
    this.liveChunks.push({ extent, bark: false });
    this.drawLiveWaveform();
    return extent;
  }

  /**
   * Upload audio/video files and trigger analyseAudio
   */
  uploadAudioVideo(file: { blob: Blob }): void {
    this.clearBarkData();
    this.clearCanvas();
    this.isAnalyzing = true;
    const fileReader = new FileReader();
    fileReader.onload = (ev) => {
      void (async () => {
        try {
          this.audioContext = new AudioContext();
          const buffer = await this.audioContext.decodeAudioData(
            ev.target!.result as ArrayBuffer,
          );
          this.analyseAudio(buffer);
        } catch {
          // Undecodable/unsupported audio — tell the user instead of hanging
          this.isAnalyzing = false;
          this.outcome = 'error';
        }
      })();
    };
    fileReader.readAsArrayBuffer(file.blob);
  }

  willDestroy(): void {
    super.willDestroy();
    this.sweepControls?.stop();
  }

  /** Bark events fully revealed at this point of the sweep */
  private countBarksRevealed(progress: number): number {
    const revealed = this.barksOccurred.slice(
      0,
      Math.floor(this.barksOccurred.length * progress),
    );

    let count = 0;
    let previous = false;

    for (const bark of revealed) {
      if (bark && !previous) {
        count++;
      }
      previous = bark;
    }

    return count;
  }

  /** Amplitude deviation from the 0.5 silence midline, scaled to 0..1 */
  private getChunkExtent(amplitudeArray: ArrayLike<number>): number {
    const { minValue, maxValue } = getTimeDomainMaxMin(amplitudeArray);
    return Math.min(1, Math.max(0, maxValue - 0.5, 0.5 - minValue) * 2);
  }

  /**
   * Sizes the canvas buffer to its CSS size * devicePixelRatio so bars render
   * crisply, and returns a context scaled back to CSS pixel coordinates.
   */
  private getSizedCanvas():
    | { ctx: CanvasRenderingContext2D; width: number; height: number }
    | undefined {
    const canvas = document.getElementById('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { ctx, width, height };
  }

  /** Draws the analyzed waveform up to `progress` (0..1) of its bars */
  private drawAnalyzedWaveform(progress: number): void {
    const sized = this.getSizedCanvas();
    if (!sized) {
      return;
    }

    const maxBars = Math.floor(sized.width / BAR_STEP);
    const bars = aggregateChunks(this.chunks, maxBars);

    // Stretch short clips across the canvas (chunkier bars, capped so a
    // two-bark clip doesn't become comically wide), and center the strip
    const step = Math.min(
      12,
      Math.max(BAR_STEP, Math.floor(sized.width / Math.max(bars.length, 1))),
    );
    const offsetX = Math.max(0, (sized.width - bars.length * step) / 2);

    this.drawBars(sized, bars, Math.round(bars.length * progress), {
      offsetX,
      step,
    });
  }

  /** Draws the live microphone waveform, newest chunk at the right edge */
  private drawLiveWaveform(): void {
    const sized = this.getSizedCanvas();
    if (!sized) {
      return;
    }

    const maxBars = Math.floor(sized.width / BAR_STEP);
    const bars = this.liveChunks.slice(-maxBars);
    this.drawBars(sized, bars, bars.length, {
      offsetX: sized.width - bars.length * BAR_STEP,
    });
  }

  /** Mirrored rounded bars around the vertical center, with a glow */
  private drawBars(
    sized: { ctx: CanvasRenderingContext2D; width: number; height: number },
    bars: WaveformChunk[],
    visibleCount: number,
    { offsetX = 0, step = BAR_STEP }: { offsetX?: number; step?: number } = {},
  ): void {
    const { ctx, width, height } = sized;
    const barWidth = Math.max(BAR_WIDTH, step - 2);

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, WAVE_TEAL);
    gradient.addColorStop(1, WAVE_MINT);

    for (let i = 0; i < Math.min(visibleCount, bars.length); i++) {
      const bar = bars[i]!;
      const barHeight = Math.max(
        MIN_BAR_HEIGHT,
        bar.extent * (height - MIN_BAR_HEIGHT * 2),
      );
      const x = offsetX + i * step;
      const y = (height - barHeight) / 2;

      if (bar.bark) {
        ctx.fillStyle = WAVE_MINT;
        ctx.shadowColor = WAVE_MINT;
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = gradient;
        ctx.shadowColor = WAVE_TEAL;
        ctx.shadowBlur = 5;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }
}

declare module '@ember/service' {
  interface Registry {
    'audio-analyzer': AudioAnalyzerService;
  }
}
