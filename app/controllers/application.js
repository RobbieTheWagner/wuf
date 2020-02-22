import Controller from '@ember/controller';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class ApplicationController extends Controller {
  @action
  analyseAudio() {
    const video = document.createElement('video');
    video.setAttribute('src', 'video.mp4');
    video.controls = true;
    video.autoplay = true;
    document.body.appendChild(video);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();

    const source = audioContext.createMediaElementSource(video);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    later(
      this,
      function() {
        const audioData = analyser.getByteTimeDomainData(dataArray);
        debugger;
      },
      1000
    );
  }
}
