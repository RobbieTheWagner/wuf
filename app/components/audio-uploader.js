import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class AudioUploaderComponent extends Component {
  @service audioAnalyzer;

  @action
  uploadFile(file) {
    this.audioAnalyzer.uploadAudioVideo({
      blob: file.blob,
    });
  }
}
