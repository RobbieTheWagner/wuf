import { mean, modeString } from 'wuf/utils/statistics';

export type Pitch = 'low' | 'mid' | 'high';
export type BarkType = 'alert' | 'distress' | 'greeting' | 'playful';

/**
 * Determines if a bark occurred, based on a given threshold
 * @param timeDomainData The array of time domain data
 * @param threshold The threshold to determine if the amplitude signaled a bark
 */
export function determineBarkOccurred(
  timeDomainData: ArrayLike<number>,
  threshold = 0.55,
): boolean {
  const { minValue, maxValue } = getTimeDomainMaxMin(timeDomainData);
  return minValue > threshold || maxValue > threshold;
}

/**
 * Determines if a bark was low, medium, or high pitch by taking the average
 * decibels of each range and seeing which range was loudest.
 * @param frequencyData The array of decibel values for each frequency
 */
export function determineBarkPitch(
  frequencyData: Uint8Array,
): Pitch | undefined {
  const lowMean = mean(frequencyData.slice(0, 4));
  const midMean = mean(frequencyData.slice(4, 8));
  const highMean = mean(frequencyData.slice(8, 12));

  if (lowMean > midMean && lowMean > highMean) {
    return 'low';
  }

  if (midMean > lowMean && midMean > highMean) {
    return 'mid';
  }

  if (highMean > lowMean && highMean > midMean) {
    return 'high';
  }

  return undefined;
}

/**
 * Uses the number of barks and their pitches to determine a bark type
 * @param barksOccurredData An array of booleans where the amplitude spiked
 * @param pitchData An array of pitches (low, mid, or high)
 */
export function determineBarkType(
  barksOccurredData: boolean[],
  pitchData: (Pitch | undefined)[],
): BarkType | undefined {
  const barks: (Pitch | undefined)[] = [];
  let barkSegmentPitches: (Pitch | undefined)[] = [];

  barksOccurredData.forEach((barkOccurred, i) => {
    if (barkOccurred) {
      barkSegmentPitches.push(pitchData[i]);
    } else {
      // If we had some pitches from the barkSegment, find what their average pitch was
      if (barkSegmentPitches.length) {
        barks.push(modeString(barkSegmentPitches.filter(Boolean) as Pitch[]));
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
    const mostFrequentlyOccurringPitch = modeString(
      barks.filter(Boolean) as Pitch[],
    );

    if (mostFrequentlyOccurringPitch === 'low') {
      if (barks.includes('mid')) {
        return 'playful';
      }

      return 'alert';
    }

    return 'playful';
  }

  return undefined;
}

/**
 * Gets the max and min values of the amplitudes and divides by 256, so they
 * will be on a scale from a flat line at 0, to max amplitude at 1.
 * @param amplitudeArray The array of amplitude data
 */
export function getTimeDomainMaxMin(amplitudeArray: ArrayLike<number>): {
  minValue: number;
  maxValue: number;
} {
  let minValue = 9999999;
  let maxValue = 0;

  for (let i = 0; i < amplitudeArray.length; i++) {
    const value = amplitudeArray[i]! / 256;
    if (value > maxValue) {
      maxValue = value;
    } else if (value < minValue) {
      minValue = value;
    }
  }

  return { minValue, maxValue };
}
