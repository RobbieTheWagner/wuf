import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkType,
  getTimeDomainMaxMin,
} from 'wuf/utils/barks';
import { module, skip, test } from 'qunit';

module('Unit | Utility | barks', function () {
  skip('determineBarkOccurred', function (assert) {
    let result = determineBarkOccurred();
    assert.ok(result);
  });

  skip('determineBarkPitch', function (assert) {
    let result = determineBarkPitch();
    assert.ok(result);
  });

  skip('determineBarkType', function (assert) {
    let result = determineBarkType();
    assert.ok(result);
  });

  test('getTimeDomainMaxMin', function (assert) {
    const timeDomainValues = [128, 190, 90, 111, 175];
    let { minValue, maxValue } = getTimeDomainMaxMin(timeDomainValues);
    assert.equal(minValue, 0.3515625);
    assert.equal(maxValue, 0.7421875);
  });
});
