import Service from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkType,
  getTimeDomainMaxMin
} from 'wuf/utils/barks';

const barkDescriptions = {
  alert:
    'Your dog may be alerting you to a potential problem or intruder nearby.',
  distress: 'Your dog may be in pain or scared.',
  greeting: 'Your dog is saying hello!',
  playful: 'Your dog wants to play!'
};

export default class AudioAnalyzerService extends Service {
  @tracked barkType;
  canvasWidth = 800;
  canvasHeight = 256;
  column = 0;

  barksOccurred = [];
  pitches = [];

  get barkDescription() {
    return barkDescriptions[this.barkType];
  }

  /**
   * Analyze the audio data and provide vizualizations
   * @param {AudioBuffer} buffer The audio buffer containing our sound data
   */
  @action
  async analyseAudio(buffer) {
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
      analyser.getByteTimeDomainData(this.amplitudeArray);
      analyser.getByteFrequencyData(this.frequencyArray);

      // Since dog barks range from 250-4000 Hz, we should exclude any buckets above 4000 Hz
      // This means we only need the first 12 buckets, which should cover ~0-4140 Hz
      const dogRangeFrequencyArray = this.frequencyArray.slice(0, 12);
      const pitch = determineBarkPitch(dogRangeFrequencyArray);
      const barkOccurred = determineBarkOccurred(this.amplitudeArray);

      this.barksOccurred.push(barkOccurred);
      this.pitches.push(pitch);

      this.drawTimeDomain();
    };

    bufferSource.start(0);
    offline.startRendering();
  }

  @action
  clearCanvas() {
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  @action
  drawTimeDomain() {
    const ctx = document.getElementById('canvas').getContext('2d');

    const { minValue, maxValue } = getTimeDomainMaxMin(this.amplitudeArray);

    var y_lo = this.canvasHeight - this.canvasHeight * minValue - 1;
    var y_hi = this.canvasHeight - this.canvasHeight * maxValue - 1;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.column, y_lo, 1, y_hi - y_lo);

    // loop around the canvas when we reach the end
    this.column += 1;
    if (this.column >= this.canvasWidth) {
      this.column = 0;
      this.clearCanvas();
    }
  }

  /**
   * Upload audio/video files and trigger analyseAudio
   * @param {*} file
   */
  @action
  async uploadAudioVideo(file) {
    this.barkType = null;
    const fileReader = new FileReader();
    fileReader.onload = async ev => {
      this.audioContext = new AudioContext();
      const buffer = await this.audioContext.decodeAudioData(ev.target.result);
      this.analyseAudio(buffer);
    };
    return fileReader.readAsArrayBuffer(file.blob);
  }
}
