import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ApplicationController extends Controller {
  canvasWidth = 800;
  canvasHeight = 256;
  column = 0;

  /**
   * Analyze the audio data and provide vizualizations
   * @param {AudioBuffer} buffer The audio buffer containing our sound data
   */
  @action
  async analyseAudio(buffer) {
    const offline = new OfflineAudioContext(2, buffer.length, 44100);
    const bufferSource = offline.createBufferSource();
    bufferSource.buffer = buffer;

    var analyser = offline.createAnalyser();
    var scp = offline.createScriptProcessor(1024, 0, 1);

    bufferSource.connect(analyser);
    scp.connect(offline.destination); // this is necessary for the script processor to start

    this.amplitudeArray = new Uint8Array(analyser.frequencyBinCount);
    scp.onaudioprocess = () => {
      analyser.getByteTimeDomainData(this.amplitudeArray);
      this.drawTimeDomain();
    };

    bufferSource.start(0);
    offline.oncomplete = function(e) {
      console.log('analysed');
    };
    offline.startRendering();
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

  @action
  clearCanvas() {
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Upload audio/video files and trigger analyseAudio
   * @param {*} file
   */
  @action
  async uploadAudioVideo(file) {
    const fileReader = new FileReader();
    fileReader.onload = async ev => {
      this.audioContext = new AudioContext();
      const buffer = await this.audioContext.decodeAudioData(ev.target.result);
      this.analyseAudio(buffer);
    };
    return fileReader.readAsArrayBuffer(file.blob);
  }
}
