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
2. **`app/services/audio-analyzer.ts`** — the central service. Decodes the blob, replays it through an `OfflineAudioContext` with an AnalyserNode (fftSize 128, script processor chunks of 1024 samples), collecting per-chunk amplitude (bark occurred?) and frequency (pitch) data into tracked arrays. Also draws the waveform onto the `#canvas` element. When rendering ends it sets `barkType`, which the `bark-type` component and route templates react to.
3. **`app/utils/barks.ts`** — pure functions holding the classification logic: amplitude threshold for bark detection, frequency-bucket means for pitch (only the first 12 bins ≈ 0–4140 Hz matter, the dog bark range), and bark-count/pitch heuristics mapping to the four bark types. `app/utils/statistics.ts` has the mean/mode helpers. Unit tests cover these against recorded fixtures in `tests/fixtures/`.

Routes (`/`, `/upload`, `/microphone`) are defined in `app/router.ts` (using `@embroider/router`); route templates in `app/templates/*.gts` are class-based components that inject the audio-analyzer service directly — there are no controllers or route classes beyond `routes/application.ts`.

In tests, the real audio pipeline is replaced by `tests/helpers/mocked-audio-analyzer-service.ts`, since OfflineAudioContext rendering isn't reliable in CI.

## SVG icons

SVGs live in `app/svgs/` and are imported as components via `@svg-jar/plugin` (e.g. `import Mic from 'wuf/svgs/mic.svg'`), compiled into a sprite. **Do not add image-optimization plugins to the Netlify build** — SVGO strips `<symbol>` elements from the sprite and breaks every icon (see note in `netlify.toml`).

## Styling

Tailwind CSS 4 via `@tailwindcss/vite` — theme/config lives in CSS (`app/styles/app.css`), not a JS config file.

## Deployment

Netlify (`netlify.toml`): `pnpm build`, publishes `dist/`, SPA redirect of all routes to `index.html`. CI (GitHub Actions) runs `pnpm lint` and `pnpm test` on pushes/PRs.
