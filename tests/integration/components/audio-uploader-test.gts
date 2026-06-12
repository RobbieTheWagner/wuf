import { module, test } from 'qunit';
import { setupRenderingTest } from 'wuf/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import { selectFiles } from 'ember-file-upload/test-support';
import AudioUploader from 'wuf/components/audio-uploader';
import AudioAnalyzerService from 'wuf/services/audio-analyzer';

class StubAudioAnalyzerService extends AudioAnalyzerService {
  uploadedBlobs: Blob[] = [];

  uploadAudioVideo(file: { blob: Blob }): void {
    this.uploadedBlobs.push(file.blob);
  }
}

module('Integration | Component | audio-uploader', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:audio-analyzer', StubAudioAnalyzerService);
  });

  test('selecting a file sends it to the audio analyzer', async function (assert) {
    const service = this.owner.lookup(
      'service:audio-analyzer',
    ) as StubAudioAnalyzerService;

    await render(<template><AudioUploader /></template>);

    assert.dom('[data-test-audio-upload-link]').hasText('Add audio/video.');

    const file = new File(['fake audio'], 'bark.webm', {
      type: 'audio/webm',
    });
    await selectFiles('#upload-audio', file);
    await settled();

    assert.strictEqual(
      service.uploadedBlobs.length,
      1,
      'the file was handed to the audio-analyzer service',
    );
  });
});
