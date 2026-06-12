import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import FileDropzone from 'ember-file-upload/components/file-dropzone';
import fileQueue from 'ember-file-upload/helpers/file-queue';
import type { UploadFile } from 'ember-file-upload';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import House from 'wuf/svgs/house.svg';

export default class AudioUploader extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  @action
  async uploadFile(file: UploadFile) {
    const base64 = await file.readAsDataURL();
    const binary = convertDataURIToBinary(base64 as string);
    const blob = new Blob([binary], { type: file.file.type || 'audio/webm' });
    this.audioAnalyzer.uploadAudioVideo({ blob });
  }

  <template>
    {{#let (fileQueue name="audio" onFileAdded=this.uploadFile) as |queue|}}
      <FileDropzone class="block" @queue={{queue}} as |dropzone|>
        <div
          class="border-2 border-dashed duration-300 ease-out p-8 rounded-3xl text-center transition-all
            {{if
              dropzone.active
              'bg-btn/10 border-btn-hover scale-[1.02]'
              'border-white/20'
            }}"
        >
          <div
            class="inline-block panel p-2 rotate-2
              {{if dropzone.active 'motion-safe:animate-breathe'}}"
          >
            <House height="110" width="110" />
          </div>

          {{#if dropzone.active}}
            <p class="display mt-4 text-2xl text-btn-hover">
              Drop it!
            </p>
          {{else}}
            <h4 class="display mt-4 text-2xl text-white">
              Add audio or video
            </h4>

            <p class="mt-2 text-white/60">
              {{#if dropzone.supported}}
                Drag a clip here, or
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
                  class="cursor-pointer font-semibold text-btn-hover underline underline-offset-4"
                  id="upload-audio-link"
                  tabindex="0"
                  data-test-audio-upload-link
                >
                  browse your files.
                </span>
              </label>
            </p>
          {{/if}}
        </div>
      </FileDropzone>
    {{/let}}
  </template>
}
