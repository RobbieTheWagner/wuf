import { module, test } from 'qunit';
import { setupRenderingTest } from 'wuf/tests/helpers';
import { render } from '@ember/test-helpers';
import Footer from 'wuf/components/footer';

module('Integration | Component | footer', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the copyright notice', async function (assert) {
    await render(<template><Footer /></template>);

    assert.dom().includesText('Ship Shape Consulting LLC.');
    assert.dom('a[href="https://shipshape.io"]').exists();
  });
});
