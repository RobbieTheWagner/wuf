import { module, test } from 'qunit';
import { visit, currentURL, click, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'wuf/tests/helpers';
import { selectFiles } from 'ember-file-upload/test-support';
import MockedAudioAnalyzerService from 'wuf/tests/helpers/mocked-audio-analyzer-service';
import convertDataURIToBinary from 'wuf/utils/convert-data-uri-to-binary';
import base64Audio from 'wuf/tests/fixtures/sample-audio-data';

module('Acceptance | analyze audio', function (hooks) {
  setupApplicationTest(hooks);

  let binary: Uint8Array<ArrayBuffer>;
  let audioAnalyzerServiceMock: MockedAudioAnalyzerService;

  hooks.beforeEach(function () {
    binary = convertDataURIToBinary(base64Audio);

    this.owner.register('service:audio-analyzer', MockedAudioAnalyzerService);

    audioAnalyzerServiceMock = this.owner.lookup(
      'service:audio-analyzer',
    ) as MockedAudioAnalyzerService;
  });

  test('record an audio clip and it is analyzed', async function (assert) {
    audioAnalyzerServiceMock.recordingBlob = new Blob([binary], {
      type: 'audio/webm',
    });

    await visit('/');

    assert.strictEqual(currentURL(), '/');

    await click('[data-test-record-link-to]');

    assert.strictEqual(currentURL(), '/microphone');

    assert
      .dom('[data-test-no-bark-type]')
      .includesText('No data uploaded yet.');

    await click('[data-test-start-recording-button]');

    setTimeout(() => {
      void click('[data-test-stop-recording-button]');
    }, 200);

    await waitFor('[data-test-bark-type]', { timeout: 10000 });

    assert.dom('[data-test-bark-type]').includesText('Alert');
  });

  test('upload an audio clip and it is analyzed', async function (assert) {
    const file = new File([binary], 'test.webm', { type: 'audio/webm' });
    audioAnalyzerServiceMock.mockType = 'file';

    await visit('/');

    assert.strictEqual(currentURL(), '/');

    await click('[data-test-upload-link-to]');

    assert.strictEqual(currentURL(), '/upload');

    assert
      .dom('[data-test-no-bark-type]')
      .includesText('No data uploaded yet.');

    await selectFiles('#upload-audio', file);

    await waitFor('[data-test-bark-type]', { timeout: 10000 });

    assert.dom('[data-test-bark-type]').includesText('Alert');
  });
});
