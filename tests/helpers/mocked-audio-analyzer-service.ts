import AudioAnalyzerService from 'wuf/services/audio-analyzer';

/**
 * An audio-analyzer that analyzes a known blob instead of live microphone
 * input, so tests can exercise the full analysis pipeline deterministically.
 */
export default class MockedAudioAnalyzerService extends AudioAnalyzerService {
  mockType: 'recording' | 'file' = 'recording';
  recordingBlob?: Blob;

  uploadAudioVideo(file: { blob: Blob }): void {
    const blob = this.mockType === 'recording' ? this.recordingBlob : file.blob;

    if (!blob) {
      throw new Error('No recordingBlob set on MockedAudioAnalyzerService');
    }

    super.uploadAudioVideo({ blob });
  }
}
