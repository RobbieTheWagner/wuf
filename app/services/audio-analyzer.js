import Service from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { mean, median, mode } from 'wuf/utils/statistics';

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

  amplitudeData = [];
  frequencyData = [];

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
      debugger;
      this.determineBarkType();
    };
    bufferSource.buffer = buffer;

    const analyser = offline.createAnalyser();
    // fftSize of 128 means we will have 64 for frequencyBinCount
    analyser.fftSize = 128;
    const scp = offline.createScriptProcessor(1024, 0, 1);

    bufferSource.connect(analyser);
    scp.connect(offline.destination); // this is necessary for the script processor to start

    this.amplitudeArray = new Uint8Array(analyser.frequencyBinCount);
    this.frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    scp.onaudioprocess = () => {
      analyser.getByteTimeDomainData(this.amplitudeArray);
      analyser.getByteFrequencyData(this.frequencyArray);

      this.amplitudeData.push({
        mean: mean(this.amplitudeArray),
        median: median(this.amplitudeArray),
        mode: mode(this.amplitudeArray)
      });

      this.frequencyData.push({
        mean: mean(this.frequencyArray),
        median: median(this.frequencyArray),
        mode: mode(this.frequencyArray)
      });

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
  determineBarkType() {
    const { amplitudeArray, frequencyArray } = this;
    this.barkType = 'play';
  }

  @action
  drawTimeDomain() {
    var minValue = 9999999;
    var maxValue = 0;
    const ctx = document.getElementById('canvas').getContext('2d');

    for (var i = 0; i < this.amplitudeArray.length; i++) {
      var value = this.amplitudeArray[i] / 256;
      if (value > maxValue) {
        maxValue = value;
      } else if (value < minValue) {
        minValue = value;
      }
    }

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
