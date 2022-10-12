import { module, test } from 'qunit';
import { visit, currentURL, click, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { later } from '@ember/runloop';
import { selectFiles } from 'ember-file-upload/test-support';
import MockedAudioAnalyzerService from 'wuf/tests/helpers/mocked-audio-analyzer-service';
import convertDataURIToBinary from 'wuf/tests/helpers/convert-data-uri-to-binary';
import base64Audio from 'wuf/tests/fixtures/sample-audio-data';

module('Acceptance | analyze audio', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    this.binary = convertDataURIToBinary(base64Audio);

    this.owner.register('service:audio-analyzer', MockedAudioAnalyzerService);

    this.audioAnalyzerServiceMock = this.owner.lookup('service:audio-analyzer');
  });

  test('record an audio clip and it is analyzed', async function (assert) {
    const recordingBlob = new Blob([this.binary], { type: 'audio/webm' });
    this.audioAnalyzerServiceMock.recordingBlob = recordingBlob;

    await visit('/');

    assert.equal(currentURL(), '/');

    await click('[data-test-record-link-to]');

    assert.equal(currentURL(), '/microphone');

    assert
      .dom('[data-test-no-bark-type]')
      .includesText('No data uploaded yet.');

    await click('[data-test-start-recording-button]');

    later(async () => {
      await click('[data-test-stop-recording-button]');
    }, 200);

    await waitFor('[data-test-bark-type]');

    await assert.dom('[data-test-bark-type]').includesText('Alert');
  });

  test('upload an audio clip and it is analyzed', async function (assert) {
    const file = new File([this.binary], 'test.webm', { type: 'audio/webm' });
    this.audioAnalyzerServiceMock.mockType = 'file';

    await visit('/');

    assert.equal(currentURL(), '/');

    await click('[data-test-upload-link-to]');

    assert.equal(currentURL(), '/upload');

    assert
      .dom('[data-test-no-bark-type]')
      .includesText('No data uploaded yet.');

    await selectFiles('#upload-audio', file);

    await waitFor('[data-test-bark-type]');

    await assert.dom('[data-test-bark-type]').includesText('Alert');
  });
});
