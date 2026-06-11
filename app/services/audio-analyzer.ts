import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkType,
  getTimeDomainMaxMin,
} from 'wuf/utils/barks';
import type { BarkType, Pitch } from 'wuf/utils/barks';

const barkDescriptions: Record<BarkType, string> = {
  alert:
    'Your dog may be alerting you to a potential problem or intruder nearby.',
  distress: 'Your dog may be in pain or scared.',
  greeting: 'Your dog is saying hello!',
  playful: 'Your dog wants to play!',
};

export default class AudioAnalyzerService extends Service {
  @tracked barkType?: BarkType;
  @tracked barksOccurred: boolean[] = [];
  @tracked pitches: (Pitch | undefined)[] = [];

  column = 0;
  amplitudeArray?: Uint8Array<ArrayBuffer>;
  frequencyArray?: Uint8Array<ArrayBuffer>;
  audioContext?: AudioContext;

  get barkDescription(): string | undefined {
    return this.barkType ? barkDescriptions[this.barkType] : undefined;
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
      this.barkType = determineBarkType(this.barksOccurred, this.pitches);
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
      const barkOccurred = determineBarkOccurred(this.amplitudeArray!);

      this.barksOccurred.push(barkOccurred);
      this.pitches.push(pitch);

      this.drawTimeDomain();
    };

    bufferSource.start(0);
    void offline.startRendering();
  }

  /**
   * Resets the barkType, barksOccurred, and pitches for a fresh run
   */
  clearBarkData(): void {
    this.barkType = undefined;
    this.barksOccurred = [];
    this.column = 0;
    this.pitches = [];
  }

  clearCanvas(): void {
    const canvas = document.getElementById('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  /**
   * Draws a visualization of the time domain data
   */
  drawTimeDomain(): void {
    const canvas = document.getElementById('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const canvasHeight = canvas.clientHeight;
    const canvasWidth = canvas.clientWidth;
    const ctx = canvas.getContext('2d')!;

    const { minValue, maxValue } = getTimeDomainMaxMin(this.amplitudeArray!);

    const yLo = canvasHeight - canvasHeight * minValue - 1;
    const yHi = canvasHeight - canvasHeight * maxValue - 1;

    ctx.fillStyle = '#6FFFE9';
    ctx.fillRect(this.column, yLo, 1, yHi - yLo);

    // loop around the canvas when we reach the end
    this.column += 1;
    if (this.column >= canvasWidth) {
      this.column = 0;
      this.clearCanvas();
    }
  }

  /**
   * Upload audio/video files and trigger analyseAudio
   */
  uploadAudioVideo(file: { blob: Blob }): void {
    this.clearBarkData();
    this.clearCanvas();
    const fileReader = new FileReader();
    fileReader.onload = (ev) => {
      void (async () => {
        this.audioContext = new AudioContext();
        const buffer = await this.audioContext.decodeAudioData(
          ev.target!.result as ArrayBuffer,
        );
        this.analyseAudio(buffer);
      })();
    };
    fileReader.readAsArrayBuffer(file.blob);
  }
}

declare module '@ember/service' {
  interface Registry {
    'audio-analyzer': AudioAnalyzerService;
  }
}
