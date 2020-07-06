import Component from '@glimmer/component';
import { action } from '@ember/object';
import { Plugins } from '@capacitor/core';
const { VoiceRecorder, Device } = Plugins;

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
      const { value } = await VoiceRecorder.stopRecording();
      const { recordDataBase64 } = value;
      // const audioRef = new Audio(`data:audio/aac;base64,${recordDataBase64}`)
      let raw = window.atob(recordDataBase64);
      let rawLength = raw.length;
      let binary = new Uint8Array(new ArrayBuffer(rawLength));

      for (let i = 0; i < rawLength; i++) {
        binary[i] = raw.charCodeAt(i);
      }

      let blob = new Blob([binary], {
        type: 'audio/aac'
      });
      // const buffer = Uint8Array.from(window.atob(data), c => c.charCodeAt(0)).buffer;
      // const blob = new Blob([buffer], { type : 'audio/webm' });

      await this.args.uploadAudioVideo({ blob });
    } else {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }
  }
}
