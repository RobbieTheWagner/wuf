import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import FileDropzone from 'ember-file-upload/components/file-dropzone';
import fileQueue from 'ember-file-upload/helpers/file-queue';
import type { UploadFile } from 'ember-file-upload';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';

export default class AudioUploader extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  @action
  async uploadFile(file: UploadFile) {
    const base64 = await file.readAsDataURL();
    const binary = convertDataURIToBinary(base64 as string);
    const blob = new Blob([binary], { type: 'audio/webm' });
    this.audioAnalyzer.uploadAudioVideo({ blob });
  }

  <template>
    <div
      class="bg-gray-100 border border-dashed flex h-32 items-center p-4 rounded"
    >
      {{#let (fileQueue name="audio" onFileAdded=this.uploadFile) as |queue|}}
        <FileDropzone
          class="flex flex-col justify-center h-full w-full"
          @queue={{queue}}
          as |dropzone|
        >
          {{#if dropzone.active}}
            Drop to upload
          {{else}}
            <h4 class="text-heading">
              Upload Audio/Video
            </h4>
            <p>
              {{#if dropzone.supported}}
                Drag and drop audio/video files onto this area to upload them or
              {{/if}}
              <input
                type="file"
                id="upload-audio"
                accept="audio/*,video/*"
                hidden
                {{queue.selectFile}}
              />
              <label for="upload-audio">
                <span
                  class="cursor-pointer text-btn underline"
                  id="upload-audio-link"
                  tabindex="0"
                  data-test-audio-upload-link
                >
                  Add audio/video.
                </span>
              </label>
            </p>
          {{/if}}
        </FileDropzone>
      {{/let}}
    </div>
  </template>
}
