import AudioAnalyzerService from 'wuf/services/audio-analyzer';

export default class MockedAudioAnalyzerService extends AudioAnalyzerService {
  mockType = 'recording';

  uploadAudioVideo(file) {
    this.clearBarkData();
    this.clearCanvas();
    const fileReader = new FileReader();
    fileReader.onload = async (ev) => {
      this.audioContext = new AudioContext();
      const buffer = await this.audioContext.decodeAudioData(ev.target.result);
      this.analyseAudio(buffer);
    };

    let blob;

    switch (this.mockType) {
      case 'recording':
        blob = this.recordingBlob;
        break;
      case 'file':
        blob = file.blob;
        break;
    }

    return fileReader.readAsArrayBuffer(blob);
  }
}
