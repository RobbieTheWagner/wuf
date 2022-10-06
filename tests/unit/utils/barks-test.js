import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkType,
  getTimeDomainMaxMin,
} from 'wuf/utils/barks';
import { module, test } from 'qunit';
import convertDataURIToBinary from 'wuf/tests/helpers/convert-data-uri-to-binary';
import base64Audio from 'wuf/tests/fixtures/sample-audio-data';
import { waitUntil } from '@ember/test-helpers';
import processDogRangeFrequency from 'wuf/tests/helpers/process-dog-range-frequency';

module('Unit | Utility | barks', function () {
  test('determineBarkOccurred', function (assert) {
    let result = determineBarkOccurred([128, 190, 90, 111, 175]);

    assert.ok(result);
  });

  test('determineBarkPitch', async function (assert) {
    const binary = convertDataURIToBinary(base64Audio);
    const blob = new Blob([binary], { type: 'audio/webm' });

    await processDogRangeFrequency.call(this, blob);

    await waitUntil(() => this.dogRangeFrequencyArray);

    debugger;

    let result = determineBarkPitch(this.dogRangeFrequencyArray);

    assert.equal(result, 'low');
  });

  test('determineBarkType', function (assert) {
    const barksOccurred = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      true,
      false,
      true,
      true,
      false,
      true,
      true,
      false,
      true,
    ];

    const pitches = [
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'mid',
      'mid',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
      'low',
    ];

    let result = determineBarkType(barksOccurred, pitches);

    assert.equal(result, 'alert');
  });

  test('getTimeDomainMaxMin', function (assert) {
    const timeDomainValues = [128, 190, 90, 111, 175];
    let { minValue, maxValue } = getTimeDomainMaxMin(timeDomainValues);
    assert.equal(minValue, 0.3515625);
    assert.equal(maxValue, 0.7421875);
  });
});
