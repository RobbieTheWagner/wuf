import { module, test } from 'qunit';
import { setupTest } from 'wuf/tests/helpers';

module('Unit | Service | audio-analyzer', function (hooks) {
  setupTest(hooks);

  test('barkDescription maps each bark type to a description', function (assert) {
    const service = this.owner.lookup('service:audio-analyzer');

    assert.strictEqual(
      service.barkDescription,
      undefined,
      'no description before any analysis',
    );

    service.barkType = 'alert';
    assert.strictEqual(
      service.barkDescription,
      'Your dog may be alerting you to a potential problem or intruder nearby.',
    );

    service.barkType = 'playful';
    assert.strictEqual(service.barkDescription, 'Your dog wants to play!');
  });

  test('clearBarkData resets analysis state', function (assert) {
    const service = this.owner.lookup('service:audio-analyzer');

    service.barkType = 'greeting';
    service.barksOccurred = [true, false];
    service.pitches = ['low', undefined];
    service.column = 12;

    service.clearBarkData();

    assert.strictEqual(service.barkType, undefined);
    assert.deepEqual(service.barksOccurred, []);
    assert.deepEqual(service.pitches, []);
    assert.strictEqual(service.column, 0);
  });
});
