import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class AudioCapturerComponent extends Component {
  @service audioAnalyzer;

  @action
  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const options = { mimeType: 'audio/webm' };
    this.mediaRecorder = new MediaRecorder(stream, options);

    this.mediaRecorder.addEventListener('dataavailable', (e) => {
      this.audioAnalyzer.uploadAudioVideo({
        blob: e.data,
      });
    });

    this.mediaRecorder.start();
  }

  @action
  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }
}
