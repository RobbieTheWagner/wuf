import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ApplicationController extends Controller {
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

    var freqData = new Uint8Array(analyser.frequencyBinCount);
    scp.onaudioprocess = function() {
      analyser.getByteTimeDomainData(freqData);
      if (freqData.every(item => item === 128)) {
        console.log('all items 128');
      } else {
        console.log(freqData);
      }
    };

    bufferSource.start(0);
    offline.oncomplete = function(e) {
      console.log('analysed');
    };
    offline.startRendering();
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
