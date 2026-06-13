import { module, test } from 'qunit';
import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkTonality,
  determineBarkType,
  segmentBarks,
  spectralFlatness,
  summarizeRhythm,
  translateBark,
  getTimeDomainMaxMin,
} from 'wuf/utils/barks';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import base64Audio from 'wuf/tests/fixtures/sample-audio-data';
import processDogRangeFrequency from 'wuf/tests/helpers/process-dog-range-frequency';
import barksOccurred from 'wuf/tests/fixtures/barks-occurred';
import pitches from 'wuf/tests/fixtures/pitches';

/**
 * Builds aligned per-chunk arrays for a run of bark events. Each event is
 * `length` bark chunks with the given pitch/tonality, separated by `gap`
 * silent chunks — handy for exercising the rhythm and scoring logic.
 */
function buildBout(
  events: { pitch: 'low' | 'mid' | 'high'; tonality: 'tonal' | 'harsh' }[],
  { length = 2, gap = 1 } = {},
) {
  const barks: boolean[] = [];
  const pitchData: ('low' | 'mid' | 'high' | undefined)[] = [];
  const tonalityData: ('tonal' | 'harsh' | undefined)[] = [];

  events.forEach((event, i) => {
    if (i > 0) {
      for (let g = 0; g < gap; g++) {
        barks.push(false);
        pitchData.push(undefined);
        tonalityData.push(undefined);
      }
    }
    for (let c = 0; c < length; c++) {
      barks.push(true);
      pitchData.push(event.pitch);
      tonalityData.push(event.tonality);
    }
  });

  return { barks, pitchData, tonalityData };
}

/** A typed array of `n` identical bark events */
function repeat(
  n: number,
  event: { pitch: 'low' | 'mid' | 'high'; tonality: 'tonal' | 'harsh' },
) {
  return Array.from({ length: n }, () => event);
}

module('Unit | Utility | barks', function () {
  test('determineBarkOccurred returns true when amplitude spikes', function (assert) {
    assert.true(determineBarkOccurred([128, 190, 90, 111, 175]));
  });

  test('determineBarkOccurred returns false for a quiet signal', function (assert) {
    assert.false(determineBarkOccurred([128, 128, 128, 128, 128]));
  });

  test('determineBarkPitch analyzes real audio data', async function (assert) {
    const binary = convertDataURIToBinary(base64Audio);
    const blob = new Blob([binary], { type: 'audio/webm' });

    const dogRangeFrequencyArray = await processDogRangeFrequency(blob);

    assert.strictEqual(determineBarkPitch(dogRangeFrequencyArray), 'low');
  });

  test('determineBarkPitch maps the peak frequency bin to a pitch', function (assert) {
    // Peak in bin 1 (~345 Hz) → low
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([50, 200, 50, 10, 10, 10, 10, 10, 10, 10, 10, 10]),
      ),
      'low',
    );
    // Peak in bin 2 (~689 Hz) is still below the low/high split → low
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([10, 50, 200, 50, 10, 10, 10, 10, 10, 10, 10, 10]),
      ),
      'low',
    );
    // Peak in bin 3 (~1034 Hz) → high (where excited play barks land)
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([10, 10, 50, 200, 50, 10, 10, 10, 10, 10, 10, 10]),
      ),
      'high',
    );
  });

  test('spectralFlatness is ~1 for a flat spectrum and near 0 for a pure tone', function (assert) {
    assert.true(
      Math.abs(spectralFlatness([100, 100, 100, 100, 100, 100, 100, 100]) - 1) <
        1e-6,
      'a perfectly flat spectrum has flatness 1',
    );
    assert.true(
      spectralFlatness([255, 0, 0, 0, 0, 0, 0, 0]) < 0.2,
      'a single sharp peak has very low flatness',
    );
  });

  test('determineBarkTonality distinguishes harsh from tonal barks', function (assert) {
    assert.strictEqual(
      determineBarkTonality([128, 128, 128, 128, 128, 128, 128, 128]),
      'harsh',
      'broadband energy reads as harsh',
    );
    assert.strictEqual(
      determineBarkTonality([255, 0, 0, 0, 0, 0, 0, 0]),
      'tonal',
      'a concentrated peak reads as tonal',
    );
  });

  test('segmentBarks groups consecutive bark chunks into events', function (assert) {
    const events = segmentBarks(
      [true, true, false, true],
      ['low', 'low', undefined, 'high'],
      ['harsh', 'harsh', undefined, 'tonal'],
    );

    assert.deepEqual(events, [
      { startIndex: 0, endIndex: 2, pitch: 'low', tonality: 'harsh' },
      { startIndex: 3, endIndex: 4, pitch: 'high', tonality: 'tonal' },
    ]);
  });

  test('summarizeRhythm reports single, rapid, and spaced pacing', function (assert) {
    assert.deepEqual(
      summarizeRhythm([{ startIndex: 0, endIndex: 2 }]),
      { rhythm: 'single' },
      'one event is a single bark',
    );

    assert.strictEqual(
      summarizeRhythm([
        { startIndex: 0, endIndex: 2 },
        { startIndex: 3, endIndex: 5 },
      ]).rhythm,
      'rapid',
      'tightly spaced events are rapid',
    );

    assert.strictEqual(
      summarizeRhythm([
        { startIndex: 0, endIndex: 2 },
        { startIndex: 200, endIndex: 202 },
      ]).rhythm,
      'spaced',
      'events far apart are spaced',
    );
  });

  test('determineBarkType identifies an alert bark from fixture data', function (assert) {
    assert.strictEqual(determineBarkType(barksOccurred, pitches), 'alert');
  });

  test('low-pitched, harsh, rapid barking reads as alert', function (assert) {
    const { barks, pitchData, tonalityData } = buildBout(
      repeat(4, { pitch: 'low', tonality: 'harsh' }),
    );

    assert.strictEqual(
      determineBarkType(barks, pitchData, tonalityData),
      'alert',
    );
  });

  test('a single low-pitched bark reads as alert (a warning woof)', function (assert) {
    assert.strictEqual(
      determineBarkType([true, true, false], ['low', 'low', undefined]),
      'alert',
    );
  });

  test('high-pitched, repeated barking reads as playful', function (assert) {
    const { barks, pitchData } = buildBout(
      repeat(4, { pitch: 'high', tonality: 'harsh' }),
    );

    assert.strictEqual(determineBarkType(barks, pitchData), 'playful');
  });

  test('a couple of mid-pitched barks at a measured pace read as greeting', function (assert) {
    // gap of 25 chunks (~580 ms) between the two barks → "measured" rhythm
    const { barks, pitchData } = buildBout(
      [
        { pitch: 'mid', tonality: 'tonal' },
        { pitch: 'mid', tonality: 'tonal' },
      ],
      { gap: 25 },
    );

    assert.strictEqual(determineBarkType(barks, pitchData), 'greeting');
  });

  test('determineBarkType identifies a single mid bark as greeting', function (assert) {
    assert.strictEqual(
      determineBarkType([true, false], ['mid', undefined]),
      'greeting',
    );
  });

  test('determineBarkType returns undefined when no barks occurred', function (assert) {
    assert.strictEqual(
      determineBarkType([false, false], [undefined, undefined]),
      undefined,
    );
  });

  test('translateBark reports the acoustic traits behind the verdict', function (assert) {
    const { barks, pitchData, tonalityData } = buildBout(
      repeat(4, { pitch: 'low', tonality: 'harsh' }),
    );

    const translation = translateBark(barks, pitchData, tonalityData);

    assert.strictEqual(translation?.type, 'alert');
    assert.strictEqual(translation?.pitch, 'low');
    assert.strictEqual(translation?.tonality, 'harsh');
    assert.strictEqual(translation?.rhythm, 'rapid');
    assert.strictEqual(translation?.arousal, 'intense');
    assert.strictEqual(translation?.barkCount, 4);
    assert.true(
      (translation?.confidence ?? 0) > 0,
      'confidence is a positive fraction',
    );
  });

  test('translateBark returns undefined when no barks occurred', function (assert) {
    assert.strictEqual(
      translateBark([false, false], [undefined, undefined]),
      undefined,
    );
  });

  test('getTimeDomainMaxMin', function (assert) {
    const { minValue, maxValue } = getTimeDomainMaxMin([
      128, 190, 90, 111, 175,
    ]);

    assert.strictEqual(minValue, 0.3515625);
    assert.strictEqual(maxValue, 0.7421875);
  });
});
