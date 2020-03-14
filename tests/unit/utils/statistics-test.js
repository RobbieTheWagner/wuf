import { mean, modeString } from 'wuf/utils/statistics';
import { module, test } from 'qunit';

module('Unit | Utility | statistics', function() {
  test('mean', function(assert) {
    const numbers = [1, 2, 3, 4, 5, 6];
    let result = mean(numbers);
    assert.equal(result, 3.5);
  });

  test('modeString', function(assert) {
    const strings = ['apple', 'pear', 'banana', 'apple'];
    let result = modeString(strings);
    assert.equal(result, 'apple');
  });
});
