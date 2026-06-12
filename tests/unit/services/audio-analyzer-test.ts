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
    service.chunks = [{ extent: 0.5, bark: true }];
    service.revealedBarkCount = 3;
    service.isAnalyzing = true;

    service.clearBarkData();

    assert.strictEqual(service.barkType, undefined);
    assert.deepEqual(service.barksOccurred, []);
    assert.deepEqual(service.pitches, []);
    assert.deepEqual(service.chunks, []);
    assert.strictEqual(service.revealedBarkCount, 0);
    assert.false(service.isAnalyzing);
  });

  test('barkCount counts distinct bark events', function (assert) {
    const service = this.owner.lookup('service:audio-analyzer');

    assert.strictEqual(service.barkCount, 0, 'no barks before any analysis');

    service.barksOccurred = [false, true, true, false, true, false, true];
    assert.strictEqual(
      service.barkCount,
      3,
      'consecutive bark chunks count as one bark event',
    );
  });
});
