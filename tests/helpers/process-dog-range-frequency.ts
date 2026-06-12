/**
 * Decodes the given audio blob and resolves with the dog-range (0-4140 Hz)
 * frequency data from the first processed audio frame.
 */
export default function processDogRangeFrequency(
  blob: Blob,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onerror = () => reject(new Error('Failed to read audio blob'));
    fileReader.onload = (ev) => {
      void (async () => {
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
        scp.connect(offline.destination); // this is necessary for the script processor to start

        const frequencyArray = new Uint8Array(analyser.frequencyBinCount);
        let resolved = false;

        scp.onaudioprocess = () => {
          analyser.getByteFrequencyData(frequencyArray);

          // Since dog barks range from 250-4000 Hz, we only need the first
          // 12 buckets, which cover ~0-4140 Hz
          if (!resolved) {
            resolved = true;
            resolve(frequencyArray.slice(0, 12));
          }
        };

        bufferSource.start(0);
        void offline.startRendering();
      })();
    };

    fileReader.readAsArrayBuffer(blob);
  });
}
