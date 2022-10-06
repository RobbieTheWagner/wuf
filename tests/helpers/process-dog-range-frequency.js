const processDogRangeFrequency = function (blob) {
  this.analyseAudio = async (buffer) => {
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

    this.amplitudeArray = new Uint8Array(analyser.frequencyBinCount);
    // The buckets of the array range from 0-22050 Hz, with each bucket representing ~345 HzanalyseAudio
    this.frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    scp.onaudioprocess = () => {
      analyser.getByteTimeDomainData(this.amplitudeArray);
      analyser.getByteFrequencyData(this.frequencyArray);

      // Since dog barks range from 250-4000 Hz, we should exclude any buckets above 4000 Hz
      // This means we only need the first 12 buckets, which should cover ~0-4140 Hz

      this.dogRangeFrequencyArray = this.frequencyArray.slice(0, 12);
    };

    bufferSource.start(0);
    offline.startRendering();
  };

  const fileReader = new FileReader();
  fileReader.onload = async (ev) => {
    this.audioContext = new AudioContext();
    const buffer = await this.audioContext.decodeAudioData(ev.target.result);
    await this.analyseAudio(buffer);
  };
  fileReader.readAsArrayBuffer(blob);
};

export default processDogRangeFrequency;
