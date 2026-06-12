import { module, test } from 'qunit';
import { setupRenderingTest } from 'wuf/tests/helpers';
import { render, click, waitUntil } from '@ember/test-helpers';
import BarkResultSheet from 'wuf/components/bark-result-sheet';

module('Integration | Component | bark-result-sheet', function (hooks) {
  setupRenderingTest(hooks);

  test('it stays hidden when there is nothing to show', async function (assert) {
    await render(<template><BarkResultSheet /></template>);

    assert.dom('[role="dialog"]').doesNotExist();
  });

  test('it shows the live bark counter while analyzing', async function (assert) {
    await render(
      <template>
        <BarkResultSheet @isAnalyzing={{true}} @barkCount={{3}} />
      </template>,
    );

    assert.dom('[data-test-analyzing]').includesText('Analyzing');
    assert.dom('[data-test-analyzing]').includesText('3');
    assert.dom('[data-test-bark-type]').doesNotExist();
  });

  test('it shows the verdict once analyzed', async function (assert) {
    await render(
      <template>
        <BarkResultSheet
          @outcome="success"
          @barkType="alert"
          @barkDescription="Your dog may be alerting you to a potential problem or intruder nearby."
          @barkCount={{2}}
        />
      </template>,
    );

    assert.dom('[data-test-bark-type]').hasText('Alert');
    assert.dom('[data-test-bark-count]').includesText('2 barks heard');
    assert.dom().includesText('intruder nearby');
  });

  test('it explains when no barks were heard and can be dismissed', async function (assert) {
    let dismissed = false;
    const onDismiss = () => (dismissed = true);

    await render(
      <template>
        <BarkResultSheet @outcome="no-barks" @onDismiss={{onDismiss}} />
      </template>,
    );

    assert.dom('[data-test-no-barks]').includesText('No barks heard');

    await click('[data-test-dismiss-sheet]');
    // The dismiss animation resolves outside the run loop, so poll for it
    await waitUntil(() => dismissed, { timeout: 5000 });

    assert.true(dismissed, 'onDismiss was called after the exit animation');
  });

  test('it surfaces unreadable audio as an error state', async function (assert) {
    await render(<template><BarkResultSheet @outcome="error" /></template>);

    assert.dom('[data-test-analysis-error]').includesText('stumped us');
  });
});
