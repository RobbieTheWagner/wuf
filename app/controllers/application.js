import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ApplicationController extends Controller {
  @action
  async analyseAudio() {
    const audioContext = new AudioContext();

    const request = new XMLHttpRequest();
    request.open('GET', 'video.mp4', true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      var audioData = request.response;

      audioContext.decodeAudioData(
        audioData,
        function(buffer) {
          const offline = new OfflineAudioContext(2, buffer.length, 44100);
          const bufferSource = offline.createBufferSource();
          bufferSource.buffer = buffer;

          var analyser = offline.createAnalyser();
          var scp = offline.createScriptProcessor(1024, 0, 1);

          bufferSource.connect(analyser);
          scp.connect(offline.destination); // this is necessary for the script processor to start

          var freqData = new Uint8Array(analyser.frequencyBinCount);
          scp.onaudioprocess = function() {
            analyser.getByteTimeDomainData(freqData);
            if (freqData.every(item => item === 128)) {
              console.log('all items 128');
            } else {
              console.log(freqData);
            }
          };

          bufferSource.start(0);
          offline.oncomplete = function(e) {
            console.log('analysed');
          };
          offline.startRendering();
        },

        function(e) {
          console.log('Error with decoding audio data' + e.err);
        }
      );
    };

    request.send();
  }
}
