import { module, test } from 'qunit';
import { setupRenderingTest } from 'wuf/tests/helpers';
import { render, click } from '@ember/test-helpers';
import type EmberRouter from '@ember/routing/router';
import NavMenu from 'wuf/components/nav-menu';

module('Integration | Component | nav-menu', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    // LinkTo needs an initialized router in rendering tests, and only the
    // private router has setupRouter
    // eslint-disable-next-line ember/no-private-routing-service
    (this.owner.lookup('router:main') as EmberRouter).setupRouter();
  });

  test('it renders the navigation links', async function (assert) {
    await render(<template><NavMenu /></template>);

    assert.dom('a[href="/upload"]').hasText('File Upload');
    assert.dom('a[href="/microphone"]').hasText('Microphone');
    assert
      .dom('a[href="https://github.com/shipshapecode/wuf"]')
      .hasText('GitHub');
  });

  test('the mobile menu opens and closes', async function (assert) {
    await render(<template><NavMenu /></template>);

    assert.dom('.nav-links').hasClass('hidden');

    await click('[aria-label="Open navigation menu"]');
    assert.dom('.nav-links').doesNotHaveClass('hidden');

    await click('[aria-label="Close navigation menu"]');
    assert.dom('.nav-links').hasClass('hidden');
  });
});
