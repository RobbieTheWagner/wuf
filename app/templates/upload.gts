import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import AudioUploader from 'wuf/components/audio-uploader';
import BarkResultSheet from 'wuf/components/bark-result-sheet';

export default class UploadTemplate extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  @action
  resetAnalysis() {
    this.audioAnalyzer.clearBarkData();
    this.audioAnalyzer.clearCanvas();
  }

  <template>
    {{pageTitle "Upload"}}

    <div
      class="app-header flex flex-col max-w-md min-h-[calc(100dvh-7rem)] mx-auto px-6"
    >
      <header>
        <p
          class="font-semibold text-btn-hover text-sm tracking-widest uppercase"
        >
          Wüf
        </p>
        <h1 class="display mt-1 text-4xl text-white">
          Upload
        </h1>
      </header>

      <p class="mt-3 text-white/60" data-test-no-bark-type>
        Got a barking video from the dog cam? Drop it in.
      </p>

      <div class="mt-6">
        <AudioUploader />
      </div>

      <div class="grow min-h-40 mt-6 relative wave-panel">
        <canvas
          class="absolute h-full inset-0 rounded-[1.25rem] w-full"
          id="canvas"
        ></canvas>
      </div>
    </div>

    <BarkResultSheet
      @isAnalyzing={{this.audioAnalyzer.isAnalyzing}}
      @outcome={{this.audioAnalyzer.outcome}}
      @barkType={{this.audioAnalyzer.barkType}}
      @barkDescription={{this.audioAnalyzer.barkDescription}}
      @barkCount={{this.audioAnalyzer.revealedBarkCount}}
      @onDismiss={{this.resetAnalysis}}
    />
  </template>
}
