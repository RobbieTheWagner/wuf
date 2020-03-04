import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class AudioCapturerComponent extends Component {
  shouldStop = false;
  stopped = false;

  @action
  async startRecording() {
    this.shouldStop = false;
    this.stopped = false;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    const options = { mimeType: 'audio/webm' };
    const recordedChunks = [];
    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }

      if (this.shouldStop === true && this.stopped === false) {
        mediaRecorder.stop();
        this.stopped = true;
      }
    });

    mediaRecorder.addEventListener('stop', () => {
      this.args.uploadAudioVideo({ blob: new Blob(recordedChunks) });
    });

    mediaRecorder.start();
  }

  @action
  stopRecording() {
    this.shouldStop = true;
  }
}
