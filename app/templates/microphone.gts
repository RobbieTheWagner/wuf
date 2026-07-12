import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { pageTitle } from 'ember-page-title';
import type AudioAnalyzerService from 'wuf/services/audio-analyzer';
import AudioCapturer from 'wuf/components/audio-capturer';
import BarkResultSheet from 'wuf/components/bark-result-sheet';
import Bath from 'wuf/svgs/bath.svg';

export default class MicrophoneTemplate extends Component {
  @service declare audioAnalyzer: AudioAnalyzerService;

  @action
  resetAnalysis() {
    this.audioAnalyzer.clearBarkData();
    this.audioAnalyzer.clearCanvas();
  }

  <template>
    {{pageTitle "Listen"}}

    <div
      class="app-header flex flex-col max-w-md min-h-[calc(100dvh-7rem)] mx-auto px-6"
    >
      <header class="flex items-end justify-between">
        <div>
          <p
            class="font-semibold text-btn-hover text-sm tracking-widest uppercase"
          >
            Wüf
          </p>
          <h1 class="display mt-1 text-4xl text-white">
            Listen
          </h1>
        </div>

        <div class="panel p-1.5 -rotate-3">
          <Bath height="64" width="64" />
        </div>
      </header>

      <p class="mt-3 text-white/60" data-test-no-bark-type>
        Get close to your dog, tap record, and let them talk.
      </p>

      <div class="grow min-h-44 mt-6 relative wave-panel">
        <canvas
          class="absolute h-full inset-0 rounded-[1.25rem] w-full"
          id="canvas"
        ></canvas>
      </div>

      <AudioCapturer />
    </div>

    <BarkResultSheet
      @isAnalyzing={{this.audioAnalyzer.isAnalyzing}}
      @outcome={{this.audioAnalyzer.outcome}}
      @barkType={{this.audioAnalyzer.barkType}}
      @barkDescription={{this.audioAnalyzer.barkDescription}}
      @barkCount={{this.audioAnalyzer.revealedBarkCount}}
      @translation={{this.audioAnalyzer.translation}}
      @onDismiss={{this.resetAnalysis}}
    />
  </template>
}
