# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wüf analyzes dog barks (recorded from the microphone or uploaded as audio/video files) with the Web Audio API and classifies them as alert, distress, greeting, or playful. It's an Ember 7 app built with Vite/Embroider, wrapped with Capacitor for iOS/Android.

## Commands

Package manager is **pnpm** (Node 22+).

- `pnpm start` — dev server at http://localhost:4200
- `pnpm build` — production build to `dist/`
- `pnpm test` — builds in development mode, then runs the QUnit suite via testem (`vite build --mode development && ember test --path dist`)
- Single test/module: run the build step first, then filter: `ember test --path dist --filter "audio-analyzer"`. During `pnpm start`, tests are also served at http://localhost:4200/tests with live reload.
- `pnpm lint` — runs all linters concurrently (eslint, ember-template-lint, stylelint, prettier check, `ember-tsc --noEmit` type check)
- `pnpm lint:fix` — auto-fix everything, then prettier format
- Individual linters: `pnpm lint:js`, `pnpm lint:hbs`, `pnpm lint:css`, `pnpm lint:types`
- Capacitor: `pnpm cap:sync` (build + sync native projects), `pnpm cap:ios` / `pnpm cap:android` (sync + open Xcode / Android Studio). For native live reload, point `capacitor.config.json`'s `server.url` at http://localhost:4200 (don't commit that change).

## Architecture

Modern Embroider + Vite Ember app (no `app/templates/*.hbs` + controller pairs): components and route templates are `.gts` files using the `<template>` tag format; everything else is TypeScript. Imports use the `wuf/` prefix (e.g. `wuf/utils/barks`). Glint (`ember-tsc`) provides template type checking.

The core signal chain, which spans three layers:

1. **Input components** (`app/components/audio-capturer.gts`, `audio-uploader.gts`) — capture a Blob via MediaRecorder or ember-file-upload and hand it to the service.
2. **`app/services/audio-analyzer.ts`** — the central service. Decodes the blob, replays it through an `OfflineAudioContext` with an AnalyserNode (fftSize 128, script processor chunks of 1024 samples), collecting per-chunk amplitude (bark occurred?), frequency (pitch), and tonality data into tracked arrays. Also draws the waveform onto the `#canvas` element. When rendering ends it sets `barkType` and the richer `translation`, which the `bark-result-sheet` component and route templates react to.
3. **`app/utils/barks.ts`** — pure functions holding the classification logic, grounded in canine bioacoustics (Morton's structural-motivational rules; Pongrácz et al.). `translateBark` scores the four bark types (`scoreBarkType`) from two features and returns a `BarkTranslation` (verdict + traits + confidence):
   - **pitch** — `determineBarkPitch` uses the **peak (loudest) frequency bin**, not band averages. Band averages labelled almost every bark "low" because low frequencies always carry more energy; the peak bin tracks the actual fundamental. Validated against owner/curated clips: alert/greeting barks peak ~375–690 Hz (→ low), excited play barks peak ~1030–1240 Hz (→ high). The low/high split sits in the empty gap between (`LOW_PITCH_MAX_HZ`/`MID_PITCH_MAX_HZ`); at fftSize 128 (~345 Hz/bin) no bin lands in "mid", so real barks resolve to low or high.
   - **rhythm** — inter-bark interval from chunk timing (fast pulsing = agitated/alert, measured/spaced = social/greeting), plus bark count.
   - **tonality is computed (`spectralFlatness`/`determineBarkTonality`) but deliberately NOT used in scoring or the UI**: at fftSize 128 the flatness estimate saturates (~0.9–0.99 for every clip measured), so it can't separate harsh from clear barks. This is also why **distress** is the least reliable verdict — telling a fearful yelp from an excited yip needs that tonal cue. Reviving tonality would mean analysing at a finer fftSize.

   `app/utils/statistics.ts` has the mean/mode helpers. Unit tests cover these; real-recording regression coverage lives in `tests/integration/labeled-barks-test.ts`.

Routes (`/`, `/upload`, `/microphone`) are defined in `app/router.ts` (using `@embroider/router`); route templates in `app/templates/*.gts` are class-based components that inject the audio-analyzer service directly — there are no controllers or route classes beyond `routes/application.ts`.

In tests, the real audio pipeline is replaced by `tests/helpers/mocked-audio-analyzer-service.ts`, since OfflineAudioContext rendering isn't reliable in CI.

To regression-test classification against real recordings, `tests/integration/labeled-barks-test.ts` runs each clip in `tests/fixtures/labeled-barks.ts` through the full decode→render→classify pipeline (`tests/helpers/analyze-audio-blob.ts`) and asserts the expected `BarkType`. Add a clip by converting audio (or a video's audio track) to a base64 data-URI module with `node scripts/audio-to-fixture.mjs <input> [out.ts]` and registering it in the manifest. Clips the classifier currently gets wrong are flagged `knownGap: true`, which asserts them as a QUnit `todo` (expected failure) — the suite stays green but flips loudly to a real failure once a calibration change fixes them. Note: there is **no public dataset labeled by emotional bark type** (the Pongrácz context corpus is private; ESC-50/UrbanSound8K/DogSpeak only tag "dog bark"), so each clip's expected type must be human-judged from its context (watching a video helps), not taken from an off-the-shelf label.

### Classifier limitations & next steps

The classifier is solid on **alert** and **playful** (validated against owner/curated clips) but has known gaps. In rough priority order:

1. **Greeting ≈ alert (the open `todo`).** An excited greeting bark can peak as low as a guard bark (~470 Hz), so pitch + rhythm can't separate them at fftSize 128. Needs a real tonal/harmonic cue and more greeting samples. This is the failing `knownGap` fixture today.
2. **Revive tonality at a finer resolution.** fftSize 128 (~345 Hz/bin) is too coarse to measure harmonic structure, so `spectralFlatness` saturates and is excluded from scoring. A second analysis pass at fftSize 1024–2048 (~21–43 Hz/bin) could yield a real harmonic-to-noise ratio, which is the missing signal for both greeting and distress. This is the highest-leverage fix.
3. **Distress is unvalidated.** We have no labeled distress recording, and without a tonal cue a fearful yelp looks like an excited yip (both high-pitched). Need a real whimper/yelp clip as a fixture, ideally alongside (2).
4. **Pitch boundaries are tuned on a handful of clips.** `LOW_PITCH_MAX_HZ`/`MID_PITCH_MAX_HZ` sit in the gap between our observed alert (~375–690 Hz) and play (~1030–1240 Hz) peaks. **Overfitting risk:** a high-pitched small-dog _alarm_ bark would currently misclassify as playful (high pitch → play). Add small-dog alert clips and revisit the bands as the fixture set grows.
5. **Grow the labeled set generally.** Every human-labeled clip added to `tests/fixtures/labeled-barks.ts` makes recalibration safer. Prefer clips sourced from video where body language confirms the demeanor.

## SVG icons

SVGs live in `app/svgs/` and are imported as components via `@svg-jar/plugin` (e.g. `import Mic from 'wuf/svgs/mic.svg'`), compiled into a sprite. **Do not add image-optimization plugins to the Netlify build** — SVGO strips `<symbol>` elements from the sprite and breaks every icon (see note in `netlify.toml`).

## Styling

Tailwind CSS 4 via `@tailwindcss/vite` — theme/config lives in CSS (`app/styles/app.css`), not a JS config file.

## Deployment

Netlify (`netlify.toml`): `pnpm build`, publishes `dist/`, SPA redirect of all routes to `index.html`. CI (GitHub Actions) runs `pnpm lint` and `pnpm test` on pushes/PRs.
