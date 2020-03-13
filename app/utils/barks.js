import { mean } from 'wuf/utils/statistics';

/**
 * Determines if a bark occurred, based on a given threshold
 * @param {Number[]} timeDomainData The array of time domain data
 * @param {Number} threshold The threshold to determine if the amplitude signaled a bark
 */
export function determineBarkOccurred(timeDomainData, threshold = 0.5) {
  const {minValue, maxValue} = getTimeDomainMaxMin(timeDomainData);
  return (minValue > threshold) || (maxValue > threshold);
}

/**
 * Determines if a bark was low, medium, or high pitch by taking the average
 * decibels of each range and seeing which range was loudest.
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

/**
 * Gets the max and min values of the amplitudes and divides by 256, so they
 * will be on a scale from a flat line at 0, to max amplitude at 1.
 * @param {Number[]} amplitudeArray The array of amplitude data
 */
export function getTimeDomainMaxMin(amplitudeArray) {
  let minValue = 9999999;
  let maxValue = 0;

  for (let i = 0; i < amplitudeArray.length; i++) {
    const value = amplitudeArray[i] / 256;
    if (value > maxValue) {
      maxValue = value;
    } else if (value < minValue) {
      minValue = value;
    }
  }

  return { minValue, maxValue };
}
