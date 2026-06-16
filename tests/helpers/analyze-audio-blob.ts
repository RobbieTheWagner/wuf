import {
  determineBarkOccurred,
  determineBarkPitch,
  determineBarkTonality,
  translateBark,
  TONALITY_BINS,
} from 'wuf/utils/barks';
import type { BarkTranslation, Pitch, Tonality } from 'wuf/utils/barks';

/**
 * Decodes an audio blob and runs it through the same offline-render analysis
 * the service uses, returning the full {@link BarkTranslation}. This exercises
 * the real classification pipeline (pitch, tonality, rhythm, scoring) on real
 * audio, so tests can assert that a recording lands on the expected bark type.
 *
 * Resolves with undefined when no barks are detected in the clip.
 */
export default function analyzeAudioBlob(
  blob: Blob,
): Promise<BarkTranslation | undefined> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onerror = () => reject(new Error('Failed to read audio blob'));
    fileReader.onload = (ev) => {
      void (async () => {
        try {
          const audioContext = new AudioContext();
          const buffer = await audioContext.decodeAudioData(
            ev.target!.result as ArrayBuffer,
          );

          // 44100 hz is the sample rate equivalent to CD audio
          const offline = new OfflineAudioContext(2, buffer.length, 44100);
          const bufferSource = offline.createBufferSource();
          bufferSource.buffer = buffer;

          const analyser = offline.createAnalyser();
          // fftSize of 128 means we will have 64 for frequencyBinCount
          analyser.fftSize = 128;
          const scp = offline.createScriptProcessor(1024, 0, 1);

          bufferSource.connect(analyser);
          analyser.connect(scp);
          scp.connect(offline.destination);
          const amplitudeArray = new Float32Array(analyser.fftSize);
          const frequencyArray = new Uint8Array(analyser.frequencyBinCount);

          const barksOccurred: boolean[] = [];
          const pitches: (Pitch | undefined)[] = [];
          const tonalities: (Tonality | undefined)[] = [];

          scp.onaudioprocess = () => {
            analyser.getFloatTimeDomainData(amplitudeArray);
            analyser.getByteFrequencyData(frequencyArray);

            barksOccurred.push(determineBarkOccurred(amplitudeArray));
            pitches.push(determineBarkPitch(frequencyArray.slice(0, 12)));
            tonalities.push(
              determineBarkTonality(frequencyArray.slice(0, TONALITY_BINS)),
            );
          };

          bufferSource.start(0);
          await offline.startRendering();
          resolve(translateBark(barksOccurred, pitches, tonalities));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    };

    fileReader.readAsArrayBuffer(blob);
  });
}
