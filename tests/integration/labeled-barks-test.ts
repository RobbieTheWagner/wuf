import QUnit, { module, test } from 'qunit';
import analyzeAudioBlob from 'wuf/tests/helpers/analyze-audio-blob';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import labeledBarks from 'wuf/tests/fixtures/labeled-barks';

/**
 * Regression tests that run real bark recordings through the full analysis
 * pipeline and assert they classify as the expected type. Each clip's full
 * acoustic read is logged so a misclassification shows *why* (pitch, tonality,
 * rhythm) rather than just a bare pass/fail.
 *
 * Clips flagged `knownGap` are asserted with QUnit's `todo` (expected failure):
 * the suite stays green while they're broken, but the moment a calibration
 * change makes one classify correctly, `todo` reports it as a failure so we
 * promote it to a real `test`. See `tests/fixtures/labeled-barks.ts`.
 */
module('Integration | labeled barks', function () {
  labeledBarks.forEach((clip) => {
    const title = `${clip.name} classifies as ${clip.expectedType}`;

    const assertClassification = async function (assert: Assert) {
      const binary = convertDataURIToBinary(clip.dataUri);
      const blob = new Blob([binary], { type: clip.mimeType ?? 'audio/webm' });

      const translation = await analyzeAudioBlob(blob);

      assert.ok(translation, 'the clip produced a classification');
      assert.strictEqual(
        translation?.type,
        clip.expectedType,
        `expected ${clip.expectedType}, got ${translation?.type} ` +
          `(pitch=${translation?.pitch}, tonality=${translation?.tonality}, ` +
          `rhythm=${translation?.rhythm}, barks=${translation?.barkCount}, ` +
          `confidence=${translation?.confidence.toFixed(2)})`,
      );
    };

    // Known-gap clips use `todo` (expected failure) so the suite stays green
    // but flips loudly to a failure once a fix makes them classify correctly.
    if (clip.knownGap) {
      QUnit.todo(title, assertClassification);
    } else {
      test(title, assertClassification);
    }
  });
});
