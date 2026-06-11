import Component from '@glimmer/component';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import AudioUploader from 'wuf/components/audio-uploader';
import BarkType from 'wuf/components/bark-type';
import House from 'wuf/svgs/house.svg';

export default class UploadTemplate extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  <template>
    {{pageTitle "Upload"}}

    <div class="flex flex-wrap justify-center p-8 w-full">
      <div class="max-w-6xl w-full">
        <div class="lg:flex h-full items-center w-full">
          <div class="mb-2 mt-2 w-full lg:mr-8 lg:w-1/2">
            <h4
              class="font-semibold p-2 text-alt text-center uppercase lg:text-left"
            >
              Want to know
            </h4>

            <h2
              class="font-bold p-2 text-center text-heading text-3xl lg:text-left"
            >
              What your dog said?
            </h2>

            <div class="flex justify-center">
              <House class="h-auto max-w-sm w-full" />
            </div>

            <AudioUploader />
          </div>

          <div class="flex flex-col mb-2 mt-2 w-full lg:mr-8 lg:w-1/2">
            <BarkType
              @barkType={{this.audioAnalyzer.barkType}}
              @barkDescription={{this.audioAnalyzer.barkDescription}}
            />

            <div class="mb-2 mt-2">
              <h2 class="font-bold mb-2 text-heading text-2xl">
                Visualization
              </h2>

              <canvas
                class="bg-heading rounded h-40 w-full"
                id="canvas"
              ></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
}
