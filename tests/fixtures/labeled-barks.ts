import type { BarkType } from 'wuf/utils/barks';
import alertBark from 'wuf/tests/fixtures/sample-audio-data';
import alertRapidBark from 'wuf/tests/fixtures/alert-rapid-bark';
import alertMeasuredBark from 'wuf/tests/fixtures/alert-measured-bark';
import alertDoorAggressive from 'wuf/tests/fixtures/alert-door-aggressive';
import greetingSpinningBark from 'wuf/tests/fixtures/greeting-spinning-bark';
import playfulDogsPlaying from 'wuf/tests/fixtures/playful-dogs-playing';
import playfulDogsPlaying2 from 'wuf/tests/fixtures/playful-dogs-playing-2';

/**
 * Real bark recordings paired with the bark type they should classify as, so
 * the classifier can be regression-tested against actual audio (see
 * `tests/integration/labeled-barks-test.ts`).
 *
 * ## Adding a clip
 *
 * 1. Get a short (~1–5s) bark recording. Note that there is **no public
 *    dataset labeled by emotional bark type** — the influential Pongrácz et
 *    al. context corpus (Alone/Stranger/Play/…) is not downloadable, and open
 *    sets like ESC-50 / UrbanSound8K / DogSpeak only tag clips as "dog bark",
 *    not as alert/distress/greeting/playful. So the `expectedType` has to come
 *    from a human judging the recording's context (you, or a cited study), not
 *    from an off-the-shelf label.
 * 2. Convert it to a base64 data-URI module:
 *    `node scripts/audio-to-fixture.mjs my-bark.webm tests/fixtures/<name>.ts`
 * 3. Import it here and add an entry below.
 *
 * Keep clips small — they are inlined as base64 and ship with the test bundle.
 */
export interface LabeledBark {
  /** Human-readable name shown in the test output */
  name: string;
  /** The bark type a correct classification should produce */
  expectedType: BarkType;
  /** A base64 `data:audio/...;base64,...` URI for the recording */
  dataUri: string;
  /** MIME type to wrap the decoded bytes in */
  mimeType?: string;
  /**
   * The classifier is known to get this clip wrong today. The test asserts it
   * as a QUnit `todo` (expected failure) so the suite stays green but flips —
   * loudly — to a real failure the moment a calibration change fixes it. Set a
   * `note` explaining the current wrong behavior.
   */
  knownGap?: boolean;
  /** Why it's a known gap / what it currently misclassifies as */
  note?: string;
}

const labeledBarks: LabeledBark[] = [
  {
    name: 'rapid low-pitched guard barking',
    expectedType: 'alert',
    dataUri: alertBark,
    mimeType: 'audio/webm',
  },
  // ESC-50 dog clips (CC BY-NC), human-confirmed as alert/territorial barking.
  {
    name: 'rapid territorial bark bout (ESC-50)',
    expectedType: 'alert',
    dataUri: alertRapidBark,
    mimeType: 'audio/webm',
  },
  {
    name: 'measured-pace warning barks (ESC-50)',
    expectedType: 'alert',
    dataUri: alertMeasuredBark,
    mimeType: 'audio/webm',
  },
  // Owner's footage: an aggressive alert when someone was at the door.
  {
    name: "aggressive door alert (owner's footage)",
    expectedType: 'alert',
    dataUri: alertDoorAggressive,
    mimeType: 'audio/webm',
  },
  // Playful: two dogs (Odie & Jake) barking at each other during play, filmed
  // by the owner who confirms the context. Peak frequency ~1030–1240 Hz reads
  // as high pitch, which the recalibrated classifier maps to play.
  {
    name: "two dogs play-barking (owner's footage)",
    expectedType: 'playful',
    dataUri: playfulDogsPlaying,
    mimeType: 'audio/webm',
  },
  {
    name: "two dogs play-barking, take 2 (owner's footage)",
    expectedType: 'playful',
    dataUri: playfulDogsPlaying2,
    mimeType: 'audio/webm',
  },
  // Greeting: a dog spinning in circles, barking happily at a returning person
  // (Wikimedia Commons "Dog - Spinning 1", human-judged from the video's body
  // language). KNOWN GAP — see note.
  {
    name: 'excited spinning greeting barks (Wikimedia Commons)',
    expectedType: 'greeting',
    dataUri: greetingSpinningBark,
    mimeType: 'audio/webm',
    knownGap: true,
    note:
      "Misclassifies as alert. This dog's excited greeting bark peaks low " +
      '(~470 Hz), acoustically indistinguishable from a guard bark at our ' +
      'frequency resolution — so pitch + rhythm alone cannot separate it. ' +
      'Likely needs a tonal/harmonic cue (finer fftSize) plus more greeting ' +
      'samples before it can be told apart from alert.',
  },
  // Still needed: a real distress clip (whimper/yelp), plus more greeting
  // examples. There is no public dataset labeled by bark type, so these must
  // come from human-judged recordings (your own dogs, or hand-picked clips).
];

export default labeledBarks;
