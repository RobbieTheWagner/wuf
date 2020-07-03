import Component from '@glimmer/component';
import { action } from '@ember/object';
import { Plugins } from '@capacitor/core';
const { VoiceRecorder, Device } = Plugins;
import { Base64Binary } from 'wuf/utils/base64Binary';

export default class AudioCapturerComponent extends Component {
  @action
  async startRecording() {
    const deviceInfo = await Device.getInfo();

    if (deviceInfo.operatingSystem === 'ios') {
      const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
      if (canRecord) {
        const permissionGranted = await VoiceRecorder.requestAudioRecordingPermission();
        if (permissionGranted) {
          await VoiceRecorder.startRecording();
        }
      }
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      const options = { mimeType: 'audio/webm' };
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.addEventListener('dataavailable', e => {
        this.args.uploadAudioVideo({ blob: e.data });
      });

      this.mediaRecorder.start();
    }
  }

  @action
  async stopRecording() {
    const deviceInfo = await Device.getInfo();

    if (deviceInfo.operatingSystem === 'ios') {
      let result = await VoiceRecorder.stopRecording();
      let byteArray = Base64Binary.decodeArrayBuffer(result.value.recordDataBase64);

      this.args.uploadAudioVideo(byteArray);
    } else {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }
  }
}
