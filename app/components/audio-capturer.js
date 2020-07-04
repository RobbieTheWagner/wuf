import Component from '@glimmer/component';
import { action } from '@ember/object';
import { Plugins } from '@capacitor/core';
const { VoiceRecorder, Device, Filesystem } = Plugins;
import { File } from '@ionic-native/file';
import { Media } from '@ionic-native/media';

export default class AudioCapturerComponent extends Component {
  @action
  async startRecording() {
    const deviceInfo = await Device.getInfo();

    if (deviceInfo.operatingSystem === 'ios') {
      const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
      if (canRecord) {
        const permissionGranted = await VoiceRecorder.requestAudioRecordingPermission();
        if (permissionGranted) {
          File.createFile(File.tempDirectory, `${Date.now()}_wuf_audio_recording.m4a`, true).then(() => {
            this.file = Media.create(File.tempDirectory.replace(/^file:\/\//, '') + `${Date.now()}_wuf_audio_recording.m4a`);
            this.file.startRecord();
          });
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
        this.args.uploadAudioVideo(e.data);
      });

      this.mediaRecorder.start();
    }
  }

  @action
  async stopRecording() {
    const deviceInfo = await Device.getInfo();

    if (deviceInfo.operatingSystem === 'ios') {
      this.file.stopRecord();

      let { data } = await Filesystem.readFile({
        path: `file://${this.file._objectInstance.src}`
      });

      let buffer = Uint8Array.from(window.atob(data), c => c.charCodeAt(0)).buffer;

      this.args.uploadAudioVideo(buffer);
    } else {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }
  }
}
