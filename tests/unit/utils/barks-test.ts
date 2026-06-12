import { module, test } from 'qunit';
import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkType,
  getTimeDomainMaxMin,
} from 'wuf/utils/barks';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import base64Audio from 'wuf/tests/fixtures/sample-audio-data';
import processDogRangeFrequency from 'wuf/tests/helpers/process-dog-range-frequency';
import barksOccurred from 'wuf/tests/fixtures/barks-occurred';
import pitches from 'wuf/tests/fixtures/pitches';

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

  test('determineBarkPitch picks the loudest frequency range', function (assert) {
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([200, 200, 200, 200, 50, 50, 50, 50, 10, 10, 10, 10]),
      ),
      'low',
    );
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([50, 50, 50, 50, 200, 200, 200, 200, 10, 10, 10, 10]),
      ),
      'mid',
    );
    assert.strictEqual(
      determineBarkPitch(
        new Uint8Array([50, 50, 50, 50, 10, 10, 10, 10, 200, 200, 200, 200]),
      ),
      'high',
    );
  });

  test('determineBarkType identifies an alert bark from fixture data', function (assert) {
    assert.strictEqual(determineBarkType(barksOccurred, pitches), 'alert');
  });

  test('determineBarkType identifies a single high bark as alert', function (assert) {
    assert.strictEqual(
      determineBarkType([true, true, false], ['high', 'high', undefined]),
      'alert',
    );
  });

  test('determineBarkType identifies a single low bark as distress', function (assert) {
    assert.strictEqual(
      determineBarkType([true, true, false], ['low', 'low', undefined]),
      'distress',
    );
  });

  test('determineBarkType identifies a single mid bark as greeting', function (assert) {
    assert.strictEqual(
      determineBarkType([true, false], ['mid', undefined]),
      'greeting',
    );
  });

  test('determineBarkType identifies two barks as greeting', function (assert) {
    assert.strictEqual(
      determineBarkType(
        [true, false, true, false],
        ['high', undefined, 'low', undefined],
      ),
      'greeting',
    );
  });

  test('determineBarkType returns undefined when no barks occurred', function (assert) {
    assert.strictEqual(
      determineBarkType([false, false], [undefined, undefined]),
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
