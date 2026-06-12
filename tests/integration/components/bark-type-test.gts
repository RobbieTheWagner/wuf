import { module, test } from 'qunit';
import { setupRenderingTest } from 'wuf/tests/helpers';
import { render } from '@ember/test-helpers';
import BarkType from 'wuf/components/bark-type';

module('Integration | Component | bark-type', function (hooks) {
  setupRenderingTest(hooks);

  test('it shows an empty state when there is no bark data', async function (assert) {
    await render(<template><BarkType /></template>);

    assert
      .dom('[data-test-no-bark-type]')
      .includesText('No data uploaded yet.');
    assert.dom('[data-test-bark-type]').doesNotExist();
  });

  test('it shows the bark type and description once analyzed', async function (assert) {
    await render(
      <template>
        <BarkType
          @barkType="playful"
          @barkDescription="Your dog wants to play!"
        />
      </template>,
    );

    assert.dom('[data-test-bark-type]').hasText('Playful');
    assert.dom().includesText('Your dog wants to play!');
    assert.dom('[data-test-no-bark-type]').doesNotExist();
  });
});
