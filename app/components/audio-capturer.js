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
          const fileName = `${Date.now()}_wuf_audio_recording.m4a`;
          await File.createFile(File.tempDirectory, fileName, true);
          this.file = Media.create(File.tempDirectory.replace(/^file:\/\//, '') + fileName);
          this.file.startRecord();
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
      this.file.stopRecord();

      const { data } = await Filesystem.readFile({
        path: `file://${this.file._objectInstance.src}`,
      });
      const buffer = Uint8Array.from(window.atob(data), c => c.charCodeAt(0)).buffer;
      const blob = new Blob([buffer], { type : 'audio/m4a' });

      this.args.uploadAudioVideo(blob);
    } else {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      }
    }
  }
}
