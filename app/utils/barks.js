import { mean } from 'wuf/utils/statistics';

/**
 * Determines if a bark was low, medium, or high pitch
 * @param {Number[]} frequencyData The array of decibel values for each frequency
 */
export function determineBarkPitch(frequencyData) {
  const lowFrequencies = frequencyData.slice(0, 4);
  const midFrequencies = frequencyData.slice(4, 8);
  const highFrequencies = frequencyData.slice(8, 12);

  const lowMean = mean(lowFrequencies);
  const midMean = mean(midFrequencies);
  const highMean = mean(highFrequencies);

  if (lowMean > midMean && lowMean > highMean) {
    return 'low';
  }

  if (midMean > lowMean && midMean > highMean) {
    return 'mid';
  }

  if (highMean > lowMean && highMean > midMean) {
    return 'high';
  }
}

export function determineBarkType(amplitudeData, frequencyData) {
  // find highest amplitudes
  // see if there is space between a few spikes or a singular spike
}
