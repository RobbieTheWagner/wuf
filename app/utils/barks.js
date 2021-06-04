import { mean, modeString } from 'wuf/utils/statistics';

/**
 * Determines if a bark occurred, based on a given threshold
 * @param {Number[]} timeDomainData The array of time domain data
 * @param {Number} threshold The threshold to determine if the amplitude signaled a bark
 */
export function determineBarkOccurred(timeDomainData, threshold = 0.55) {
  const { minValue, maxValue } = getTimeDomainMaxMin(timeDomainData);
  return minValue > threshold || maxValue > threshold;
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

/**
 * Uses the number of barks and their pitches to determine a bark type
 * @param {Boolean[]} barksOccuredData An array of booleans where the amplitude spiked
 * @param {String[]} pitchData An array of strings low, mid, or high
 */
export function determineBarkType(barksOccuredData, pitchData) {
  const barks = [];
  let inBarkSegment = false;
  let barkSegmentPitches = [];
  barksOccuredData.forEach((barkOccurred, i) => {
    if (barkOccurred) {
      inBarkSegment = true;
    } else {
      inBarkSegment = false;
    }

    if (inBarkSegment) {
      barkSegmentPitches.push(pitchData[i]);
    } else {
      // If we had some pitches from the barkSegment, find what their average pitch was
      if (barkSegmentPitches.length) {
        const mostFrequentlyOccuringPitch = modeString(barkSegmentPitches);
        barks.push(mostFrequentlyOccuringPitch);
      }
      barkSegmentPitches = [];
    }
  });

  if (barks.length === 1) {
    const [barkPitch] = barks;

    if (barkPitch === 'high') {
      return 'alert';
    } else if (barkPitch === 'low') {
      return 'distress';
    }

    return 'greeting';
  }

  if (barks.length === 2) {
    return 'greeting';
  }

  if (barks.length > 2) {
    const mostFrequentlyOccuringPitch = modeString(barks);

    if (mostFrequentlyOccuringPitch === 'low') {
      if (barks.includes('mid')) {
        return 'playful';
      }

      return 'alert';
    }

    return 'playful';
  }
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
