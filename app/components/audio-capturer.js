import Component from '@glimmer/component';
import { action } from '@ember/object';
import { Plugins } from "@capacitor/core";
const { VoiceRecorder } = Plugins;
import { Base64Binary } from 'wuf/utils/base64Binary';

export default class AudioCapturerComponent extends Component {
  @action
  async startRecording() {
    await VoiceRecorder.startRecording();
  }

  @action
  async stopRecording() {
      let result = await VoiceRecorder.stopRecording();
      let byteArray = Base64Binary.decodeArrayBuffer(result.value.recordDataBase64);

      this.args.uploadAudioVideo(byteArray);
  }
}
