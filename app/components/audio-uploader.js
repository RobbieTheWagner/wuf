import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';

export default class AudioUploaderComponent extends Component {
  @service audioAnalyzer;

  @action
  async uploadFile(UploadFile) {
    const base64 = await UploadFile.readAsDataURL();
    const binary = convertDataURIToBinary(base64);
    const blob = new Blob([binary], { type: 'audio/webm' });
    this.audioAnalyzer.uploadAudioVideo({ blob });
  }
}
