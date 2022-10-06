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
import barksOccurred from 'wuf/tests/fixtures/barks-occurred';
import pitches from 'wuf/tests/fixtures/pitches';

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

    let result = determineBarkPitch(this.dogRangeFrequencyArray);

    assert.equal(result, 'low');
  });

  test('determineBarkType', function (assert) {
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
