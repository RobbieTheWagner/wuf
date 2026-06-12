import { module, test } from 'qunit';
import { mean, median, mode, modeString } from 'wuf/utils/statistics';

module('Unit | Utility | statistics', function () {
  test('mean', function (assert) {
    assert.strictEqual(mean([1, 2, 3, 4, 5, 6]), 3.5);
    assert.strictEqual(mean([3, 5, 4, 4, 1, 1, 2, 3]), 2.875);
  });

  test('median', function (assert) {
    assert.strictEqual(median([3, 5, 4, 4, 1, 1, 2, 3]), 3);
    assert.strictEqual(median([1, 2, 3]), 2);
  });

  test('mode', function (assert) {
    assert.deepEqual(mode([3, 5, 4, 4, 1, 1, 2, 3]), [1, 3, 4]);
    assert.deepEqual(mode([1, 1, 2]), [1]);
  });

  test('modeString', function (assert) {
    assert.strictEqual(
      modeString(['apple', 'pear', 'banana', 'apple']),
      'apple',
    );
    assert.strictEqual(modeString([]), undefined);
  });
});
