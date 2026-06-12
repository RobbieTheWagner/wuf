# Wüf

Talk to your dog with Ember! Wüf analyzes dog barks — either recorded live
from the microphone or uploaded as audio/video files — using the Web Audio
API, and tells you whether your dog's bark was an alert, distress, greeting,
or playful bark.

The web app is wrapped with [Capacitor](https://capacitorjs.com/), so it can
also be built for iOS and Android.

## Prerequisites

- [Node.js](https://nodejs.org/) (v22+, see `.tool-versions`)
- [pnpm](https://pnpm.io/)
- [Xcode](https://developer.apple.com/xcode/) (for iOS builds)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

## Installation

```sh
git clone https://github.com/shipshapecode/wuf.git
cd wuf
pnpm install
```

## Running / Development

```sh
pnpm start
```

Visit the app at [http://localhost:4200](http://localhost:4200).

### Running Tests

```sh
pnpm test
```

### Linting

```sh
pnpm lint
pnpm lint:fix
```

### Building

```sh
pnpm build
```

The production build is output to `dist/`.

## Mobile (Capacitor)

Build the web app and sync it into the native projects:

```sh
pnpm cap:sync
```

Then open the native IDE of your choice:

```sh
pnpm cap:ios     # build, sync, and open Xcode
pnpm cap:android # build, sync, and open Android Studio
```

To use live reload during native development, run `pnpm start` and point the
Capacitor dev server at it by adding the following to `capacitor.config.json`
(don't commit it):

```json
"server": {
  "url": "http://localhost:4200"
}
```
