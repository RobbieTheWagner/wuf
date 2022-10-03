import { module, test } from 'qunit';
import { visit, currentURL, click, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { getOwner } from '@ember/application';
import { later } from '@ember/runloop';

module('Acceptance | record audio', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    this.audioAnalyzer = getOwner(this).lookup(`service:audio-analyzer`);

    var BASE64_MARKER = ';base64,';

    function convertDataURIToBinary(dataURI) {
      var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
      var base64 = dataURI.substring(base64Index);
      var raw = window.atob(base64);
      var rawLength = raw.length;
      var array = new Uint8Array(new ArrayBuffer(rawLength));

      for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    }

    const data =
      'data:audio/webm;codecs=opus;base64,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';

    const binary = convertDataURIToBinary(data);

    this.blob = new Blob([binary], { type: 'audio/webm' });

    const uploadAudioVideo = async () => {
      this.audioAnalyzer.clearBarkData();
      this.audioAnalyzer.clearCanvas();
      const fileReader = new FileReader();
      fileReader.onload = async (ev) => {
        this.audioAnalyzer.audioContext = new AudioContext();
        const buffer = await this.audioAnalyzer.audioContext.decodeAudioData(
          ev.target.result
        );
        this.audioAnalyzer.analyseAudio(buffer);
      };
      return fileReader.readAsArrayBuffer(this.blob);
    };

    this.audioAnalyzer.uploadAudioVideo = uploadAudioVideo;
  });

  test('record an audio clip', async function (assert) {
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
});
