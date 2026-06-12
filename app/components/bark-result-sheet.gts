import Component from '@glimmer/component';
import { action } from '@ember/object';
import { capitalize } from '@ember/string';
import { on } from '@ember/modifier';
import { modifier } from 'ember-modifier';
import { animate, stagger } from 'motion';
import type { AnimationSequence } from 'motion';
import confetti from 'canvas-confetti';
import { Haptics, NotificationType } from '@capacitor/haptics';
import type { AnalysisOutcome } from 'wuf/services/audio-analyzer';
import type { BarkType as BarkTypeName } from 'wuf/utils/barks';
import Alert from 'wuf/svgs/alert.svg';
import DigIn from 'wuf/svgs/dig-in.svg';
import Distress from 'wuf/svgs/distress.svg';
import Greeting from 'wuf/svgs/greeting.svg';
import Playful from 'wuf/svgs/playful.svg';

const barkIcons = {
  alert: Alert,
  distress: Distress,
  greeting: Greeting,
  playful: Playful,
};

/* Full class names (not interpolated) so Tailwind sees them */
const barkAccents: Record<BarkTypeName, string> = {
  alert: 'text-bark-alert',
  distress: 'text-bark-distress',
  greeting: 'text-bark-greeting',
  playful: 'text-bark-playful',
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface BarkResultSheetSignature {
  Args: {
    isAnalyzing?: boolean;
    outcome?: AnalysisOutcome;
    barkType?: BarkTypeName;
    barkDescription?: string;
    barkCount?: number;
    onDismiss?: () => void;
  };
}

/**
 * Bottom sheet presenting the analysis: a live bark counter while the
 * waveform sweep runs, then the verdict (or a friendly no-barks/error state).
 */
export default class BarkResultSheet extends Component<BarkResultSheetSignature> {
  sheetElement?: HTMLElement;

  get isOpen() {
    return Boolean(this.args.isAnalyzing || this.args.outcome);
  }

  get icon() {
    return this.args.barkType ? barkIcons[this.args.barkType] : DigIn;
  }

  get title() {
    return this.args.barkType ? capitalize(this.args.barkType) : '';
  }

  get accent() {
    return this.args.barkType
      ? barkAccents[this.args.barkType]
      : 'text-btn-hover';
  }

  get barkNoun() {
    return this.args.barkCount === 1 ? 'bark' : 'barks';
  }

  /** Springs the sheet up from the bottom edge when it mounts */
  revealSheet = modifier((element: HTMLElement) => {
    this.sheetElement = element;

    if (!prefersReducedMotion()) {
      animate(
        element,
        { y: ['110%', '0%'] },
        { type: 'spring', bounce: 0.2, visualDuration: 0.5 },
      );
    }

    return () => {
      this.sheetElement = undefined;
    };
  });

  /**
   * Pops the verdict in (icon springs, text staggers up), celebrates a
   * playful verdict with confetti, and confirms with a success haptic.
   */
  celebrate = modifier((element: HTMLElement) => {
    if (!prefersReducedMotion()) {
      const icon = element.querySelector('[data-reveal-icon]');
      const lines = element.querySelectorAll('[data-reveal-line]');

      const sequence: AnimationSequence = [];

      if (icon) {
        sequence.push([
          icon,
          { scale: [0, 1], rotate: [-12, 0] },
          { type: 'spring', bounce: 0.5, visualDuration: 0.5 },
        ]);
      }

      sequence.push([
        lines,
        { opacity: [0, 1], y: [12, 0] },
        { delay: stagger(0.08), duration: 0.35, at: '-0.35' },
      ]);

      animate(sequence);
    }

    if (this.args.barkType === 'playful') {
      const rect = element.getBoundingClientRect();
      void confetti({
        particleCount: 110,
        spread: 75,
        startVelocity: 32,
        colors: ['#4fd8d4', '#71ffe9', '#ffd166', '#ffffff'],
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: rect.top / window.innerHeight,
        },
        disableForReducedMotion: true,
      });
    }

    Haptics.notification({ type: NotificationType.Success }).catch(() => {
      // No haptics support (e.g. desktop browser) — silently skip
    });
  });

  @action
  dismiss() {
    const element = this.sheetElement;
    const done = () => this.args.onDismiss?.();

    if (element && !prefersReducedMotion()) {
      animate(
        element,
        { y: '115%' },
        { duration: 0.25, ease: 'easeIn' },
      ).finished.then(done, done);
    } else {
      done();
    }
  }

  <template>
    {{#if this.isOpen}}
      {{! Backdrop click-to-dismiss; the dialog also has an explicit Done button }}
      {{! template-lint-disable no-invalid-interactive }}
      <div
        class="sheet-backdrop motion-safe:motion-preset-fade"
        role="presentation"
        {{on "click" this.dismiss}}
      ></div>

      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Bark analysis"
        {{this.revealSheet}}
      >
        <div class="sheet-handle"></div>

        {{#if @outcome}}
          {{#if @barkType}}
            <div {{this.celebrate}}>
              <div class="flex gap-5 items-center">
                <div class="panel p-2 shrink-0" data-reveal-icon>
                  <this.icon height="110" width="110" />
                </div>

                <div>
                  <h2
                    class="display text-4xl {{this.accent}}"
                    data-reveal-line
                    data-test-bark-type
                  >
                    {{this.title}}
                  </h2>

                  {{#if @barkCount}}
                    <p
                      class="font-semibold mt-1 text-sm text-white/60 tracking-widest uppercase"
                      data-reveal-line
                      data-test-bark-count
                    >
                      {{@barkCount}}
                      {{this.barkNoun}}
                      heard
                    </p>
                  {{/if}}

                  <p class="mt-2 text-white/80" data-reveal-line>
                    {{@barkDescription}}
                  </p>
                </div>
              </div>

              <button
                class="btn mt-6 w-full"
                type="button"
                data-test-dismiss-sheet
                {{on "click" this.dismiss}}
              >
                Done
              </button>
            </div>
          {{else if (eqOutcome @outcome "no-barks")}}
            <div class="text-center" data-test-no-barks>
              <div class="inline-block panel p-2">
                <DigIn height="110" width="110" />
              </div>

              <h2 class="display mt-4 text-3xl text-white">
                No barks heard
              </h2>

              <p class="mt-2 text-white/70">
                We listened, but nothing barked. Get a little closer to your dog
                and try again.
              </p>

              <button
                class="btn mt-6 w-full"
                type="button"
                data-test-dismiss-sheet
                {{on "click" this.dismiss}}
              >
                Try again
              </button>
            </div>
          {{else}}
            <div class="text-center" data-test-analysis-error>
              <h2 class="display mt-2 text-3xl text-white">
                That clip stumped us
              </h2>

              <p class="mt-2 text-white/70">
                We couldn't read that audio. Try a different file or record live
                instead.
              </p>

              <button
                class="btn mt-6 w-full"
                type="button"
                data-test-dismiss-sheet
                {{on "click" this.dismiss}}
              >
                Try again
              </button>
            </div>
          {{/if}}
        {{else}}
          <div
            class="py-6 rounded-2xl shimmer-sweep text-center"
            data-test-analyzing
          >
            <p
              class="font-semibold text-btn-hover text-sm tracking-widest uppercase"
            >
              Analyzing
            </p>

            <p class="display tabular-nums text-7xl text-white">
              {{if @barkCount @barkCount 0}}
            </p>

            <p class="font-semibold text-sm text-white/60">
              {{this.barkNoun}}
              detected
            </p>
          </div>
        {{/if}}
      </div>
    {{/if}}
  </template>
}

/** Helper: strict-mode template equality check for the outcome arg */
function eqOutcome(outcome: AnalysisOutcome | undefined, value: string) {
  return outcome === value;
}
