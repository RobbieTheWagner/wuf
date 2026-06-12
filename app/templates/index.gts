import { LinkTo } from '@ember/routing';
import revealOnScroll from 'wuf/modifiers/reveal-on-scroll';
import Alert from 'wuf/svgs/alert.svg';
import DigIn from 'wuf/svgs/dig-in.svg';
import Distress from 'wuf/svgs/distress.svg';
import FrenchieBall from 'wuf/svgs/frenchie-ball.svg';
import Greeting from 'wuf/svgs/greeting.svg';
import House from 'wuf/svgs/house.svg';
import Mic from 'wuf/svgs/mic.svg';
import Playful from 'wuf/svgs/playful.svg';

/** Stagger helper: delay grows with each sibling's index */
function staggerDelay(index: number, step: number): number {
  return index * step;
}

/* Ambient equalizer strip — deterministic "random" heights and timings */
const EQ_BARS = [
  'h-4 [animation-delay:0s] [animation-duration:1s]',
  'h-9 [animation-delay:0.12s] [animation-duration:0.85s]',
  'h-6 [animation-delay:0.3s] [animation-duration:1.2s]',
  'h-12 [animation-delay:0.05s] [animation-duration:0.95s]',
  'h-7 [animation-delay:0.42s] [animation-duration:1.1s]',
  'h-3 [animation-delay:0.2s] [animation-duration:0.8s]',
  'h-10 [animation-delay:0.55s] [animation-duration:1.05s]',
  'h-5 [animation-delay:0.33s] [animation-duration:0.9s]',
  'h-8 [animation-delay:0.15s] [animation-duration:1.25s]',
  'h-12 [animation-delay:0.48s] [animation-duration:0.85s]',
  'h-4 [animation-delay:0.62s] [animation-duration:1.15s]',
  'h-9 [animation-delay:0.08s] [animation-duration:0.95s]',
  'h-6 [animation-delay:0.38s] [animation-duration:1.05s]',
  'h-11 [animation-delay:0.25s] [animation-duration:0.9s]',
  'h-5 [animation-delay:0.52s] [animation-duration:1.2s]',
  'h-8 [animation-delay:0.18s] [animation-duration:0.8s]',
  'h-3 [animation-delay:0.45s] [animation-duration:1.1s]',
  'h-10 [animation-delay:0.1s] [animation-duration:1s]',
  'h-6 [animation-delay:0.58s] [animation-duration:0.9s]',
  'h-12 [animation-delay:0.28s] [animation-duration:1.15s]',
  'h-4 [animation-delay:0.4s] [animation-duration:0.85s]',
  'h-7 [animation-delay:0.02s] [animation-duration:1.25s]',
  'h-9 [animation-delay:0.5s] [animation-duration:0.95s]',
  'h-5 [animation-delay:0.22s] [animation-duration:1.05s]',
];

const STEPS = [
  {
    number: '01',
    title: 'Catch a bark',
    blurb:
      'Record your dog live or upload any audio or video clip — even that 2am one.',
    icon: House,
  },
  {
    number: '02',
    title: 'We dig into it',
    blurb:
      'Wüf reads the pitch, rhythm, and count of every bark, right on your device.',
    icon: DigIn,
  },
  {
    number: '03',
    title: 'Get the verdict',
    blurb:
      'Alert, distress, greeting, or playful — with a live waveform to prove it.',
    icon: Greeting,
  },
];

const BARK_TYPES = [
  {
    name: 'Alert',
    accent: 'text-bark-alert',
    blurb: "Something's up. Your dog is on watch and wants you to know.",
    icon: Alert,
  },
  {
    name: 'Distress',
    accent: 'text-bark-distress',
    blurb: 'Pain or fear — the bark you never want to miss.',
    icon: Distress,
  },
  {
    name: 'Greeting',
    accent: 'text-bark-greeting',
    blurb: '“Hello! You’re home! This is the best day ever.”',
    icon: Greeting,
  },
  {
    name: 'Playful',
    accent: 'text-bark-playful',
    blurb: 'Ball. Now. Please. (Repeat until ball.)',
    icon: Playful,
  },
];

<template>
  <div class="overflow-hidden relative">
    {{! ---------- Hero ---------- }}
    <section class="max-w-6xl mx-auto px-6 pb-24 pt-10 relative lg:pt-20">
      <div
        class="bg-btn glow-orb h-96 w-96 -top-24 -right-24"
        aria-hidden="true"
      ></div>
      <div
        class="bg-alt glow-orb h-80 w-80 -left-32 top-64"
        aria-hidden="true"
      ></div>

      <div class="gap-12 grid items-center relative lg:grid-cols-2">
        <div>
          <p
            class="border border-white/15 font-semibold inline-flex items-center px-4 py-1.5 rounded-full text-btn-hover text-sm"
            {{revealOnScroll}}
          >
            Bark translation, for real
          </p>

          <h1
            class="display mt-6 text-5xl text-white sm:text-6xl lg:text-7xl"
            {{revealOnScroll 0.08}}
          >
            Finally understand what your
            <span class="text-gradient">dog</span>
            is saying.
          </h1>

          <p
            class="max-w-md mt-6 text-lg text-white/70"
            {{revealOnScroll 0.16}}
          >
            Wüf listens to barks, reads their pitch and rhythm, and tells you
            whether it's an alert, distress, a greeting — or just ball
            negotiations.
          </p>

          <div class="flex flex-wrap gap-4 mt-10" {{revealOnScroll 0.24}}>
            <LinkTo class="btn" @route="microphone" data-test-record-link-to>
              <Mic height="20" width="20" aria-hidden="true" />
              Start listening
            </LinkTo>

            <LinkTo class="btn-ghost" @route="upload" data-test-upload-link-to>
              Upload a clip
            </LinkTo>
          </div>

          <div
            class="flex gap-1.5 h-12 items-end mt-14"
            aria-hidden="true"
            {{revealOnScroll 0.32}}
          >
            {{#each EQ_BARS as |bar|}}
              <span class="eq-bar motion-safe:animate-eq {{bar}}"></span>
            {{/each}}
          </div>
        </div>

        <div class="relative" {{revealOnScroll 0.2}}>
          <div class="panel p-8 rotate-2 motion-safe:animate-float lg:p-12">
            <FrenchieBall class="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>

    {{! ---------- How it works ---------- }}
    <section class="max-w-6xl mx-auto px-6 py-24 relative">
      <h2 class="display text-3xl text-white sm:text-4xl" {{revealOnScroll}}>
        From wüf to words in seconds.
      </h2>

      <div class="gap-6 grid mt-12 sm:grid-cols-3">
        {{#each STEPS as |step index|}}
          <div
            class="bg-surface border border-white/10 p-6 rounded-3xl"
            {{revealOnScroll (staggerDelay index 0.12)}}
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-btn-hover text-sm tracking-widest">
                {{step.number}}
              </span>
              <div class="panel p-2 rounded-2xl">
                <step.icon height="72" width="72" />
              </div>
            </div>

            <h3 class="display mt-6 text-2xl text-white">
              {{step.title}}
            </h3>

            <p class="mt-2 text-white/65">
              {{step.blurb}}
            </p>
          </div>
        {{/each}}
      </div>
    </section>

    {{! ---------- Bark types ---------- }}
    <section class="max-w-6xl mx-auto px-6 py-24 relative">
      <div
        class="bg-btn glow-orb h-96 w-96 -right-40 top-20"
        aria-hidden="true"
      ></div>

      <h2
        class="display relative text-3xl text-white sm:text-4xl"
        {{revealOnScroll}}
      >
        Four barks. Four very different conversations.
      </h2>

      <div class="gap-6 grid mt-12 relative sm:grid-cols-2 lg:grid-cols-4">
        {{#each BARK_TYPES as |bark index|}}
          <div
            class="bg-surface border border-white/10 duration-300 ease-out p-6 rounded-3xl transition-transform motion-safe:hover:-translate-y-2"
            {{revealOnScroll (staggerDelay index 0.1)}}
          >
            <div class="panel p-3">
              <bark.icon class="h-auto w-full" />
            </div>

            <h3 class="display mt-5 text-2xl {{bark.accent}}">
              {{bark.name}}
            </h3>

            <p class="mt-2 text-sm text-white/65">
              {{bark.blurb}}
            </p>
          </div>
        {{/each}}
      </div>
    </section>

    {{! ---------- Final CTA ---------- }}
    <section class="max-w-3xl mx-auto px-6 pb-32 pt-12 relative text-center">
      <div
        class="bg-btn glow-orb h-72 inset-x-0 mx-auto top-0 w-72"
        aria-hidden="true"
      ></div>

      <h2
        class="display relative text-4xl text-white sm:text-5xl"
        {{revealOnScroll}}
      >
        What's your dog saying
        <span class="text-gradient">right now?</span>
      </h2>

      <div class="mt-10 relative" {{revealOnScroll 0.12}}>
        <LinkTo class="btn px-12 py-5 text-lg" @route="microphone">
          <Mic height="22" width="22" aria-hidden="true" />
          Listen now
        </LinkTo>
      </div>
    </section>
  </div>
</template>
