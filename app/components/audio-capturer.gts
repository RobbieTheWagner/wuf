import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import Mic from 'wuf/svgs/mic.svg';
import StopCircle from 'wuf/svgs/stop-circle.svg';

export default class AudioCapturer extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  mediaRecorder?: MediaRecorder;

  @action
  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    this.mediaRecorder.addEventListener('dataavailable', (e) => {
      this.audioAnalyzer.uploadAudioVideo({
        blob: e.data,
      });
    });

    this.mediaRecorder.start();
  }

  @action
  stopRecording() {
    this.mediaRecorder?.stop();
  }

  <template>
    <button
      class="btn mb-4"
      type="button"
      {{on "click" this.startRecording}}
      data-test-start-recording-button
    >
      <Mic class="mr-2" />
      Start recording
    </button>

    <button
      class="btn mb-4"
      type="button"
      {{on "click" this.stopRecording}}
      data-test-stop-recording-button
    >
      <StopCircle class="mr-2" />
      Stop recording
    </button>
  </template>
}
