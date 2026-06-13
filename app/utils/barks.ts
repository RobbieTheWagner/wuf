import { mean, modeString } from 'wuf/utils/statistics';

export type Pitch = 'low' | 'mid' | 'high';
export type Tonality = 'tonal' | 'harsh';
export type Rhythm = 'single' | 'rapid' | 'measured' | 'spaced';
export type Arousal = 'calm' | 'moderate' | 'intense';
export type BarkType = 'alert' | 'distress' | 'greeting' | 'playful';

/**
 * Acoustic constants derived from our analysis pipeline.
 *
 * The AnalyserNode runs at 44.1 kHz with an fftSize of 128, so each frequency
 * bin spans ~344.5 Hz, and the ScriptProcessor hands us 1024-sample chunks, so
 * each chunk represents ~23.2 ms of audio. Those two numbers let us translate
 * bin indices into Hz and chunk indices into milliseconds.
 */
export const BIN_WIDTH_HZ = 44100 / 128; // ≈ 344.5 Hz per frequency bin
export const CHUNK_DURATION_MS = (1024 / 44100) * 1000; // ≈ 23.2 ms per chunk

/**
 * Number of low frequency bins that carry a bark's energy. Dog barks live in
 * ~250–4000 Hz, plus a little harsh high-frequency spread, so the first 16
 * bins (~0–5.5 kHz) cover the fundamental and the noisy overtones that make a
 * bark sound harsh. Bins above this are mostly silence and would bias the
 * tonality estimate, so we exclude them.
 */
export const TONALITY_BINS = 16;

/** Spectral flatness at/above this is treated as a harsh (atonal) bark. */
const HARSH_FLATNESS_THRESHOLD = 0.45;

/** Inter-bark gaps shorter than this (ms) read as fast, agitated pulsing. */
const RAPID_GAP_MS = 400;
/** Inter-bark gaps longer than this (ms) read as deliberate, spaced barking. */
const SPACED_GAP_MS = 1200;

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
 * Pitch boundaries on the peak frequency, in Hz. The low/high split sits in the
 * empty gap between where alert/guard barks peak (~375–690 Hz) and where
 * excited play barks peak (~1030–1240 Hz) across our labelled clips. At fftSize
 * 128 the bins are ~345 Hz apart (…, 689, 1034, …), so no bin actually lands in
 * the "mid" band — it's kept for clarity / finer-resolution future analysis,
 * but real barks resolve to low or high.
 */
const LOW_PITCH_MAX_HZ = 750;
const MID_PITCH_MAX_HZ = 950;

/**
 * Determines a bark's pitch from its dominant (peak) frequency bin.
 *
 * We deliberately use the loudest bin rather than band averages: low
 * frequencies always carry more energy, so averaging bands labelled almost
 * every real bark "low". The peak bin tracks the actual fundamental, which is
 * what separates the types — across our labelled clips, alert/greeting barks
 * peak around 375–680 Hz while excited play barks peak around 1000–1240 Hz.
 * @param frequencyData Decibel-scaled magnitudes for the dog-range bins
 */
export function determineBarkPitch(
  frequencyData: Uint8Array,
): Pitch | undefined {
  let peakBin = -1;
  let peak = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i]! > peak) {
      peak = frequencyData[i]!;
      peakBin = i;
    }
  }

  if (peakBin === -1 || peak === 0) {
    return undefined;
  }

  const peakHz = peakBin * BIN_WIDTH_HZ;
  if (peakHz < LOW_PITCH_MAX_HZ) {
    return 'low';
  }
  if (peakHz < MID_PITCH_MAX_HZ) {
    return 'mid';
  }
  return 'high';
}

/**
 * Spectral flatness (a.k.a. Wiener entropy): the ratio of the geometric mean
 * to the arithmetic mean of the spectrum, in the range 0..1. A peaky, harmonic
 * spectrum (a clear, tonal bark) scores near 0; broadband noise (a harsh,
 * atonal bark) scores near 1. This is a cheap stand-in for the
 * harmonic-to-noise ratio that bioacoustics research uses to gauge tonality.
 * @param frequencyData Decibel-scaled magnitudes for each frequency bin
 */
export function spectralFlatness(frequencyData: ArrayLike<number>): number {
  let logSum = 0;
  let sum = 0;
  const n = frequencyData.length;

  for (let i = 0; i < n; i++) {
    // Shift by 1 so silent bins (0) don't send the geometric mean to zero
    const value = frequencyData[i]! + 1;
    logSum += Math.log(value);
    sum += value;
  }

  if (n === 0 || sum === 0) {
    return 0;
  }

  const geometricMean = Math.exp(logSum / n);
  const arithmeticMean = sum / n;

  return geometricMean / arithmeticMean;
}

/**
 * Classifies a bark's tonality as harsh (noisy/atonal, e.g. aggression or
 * rough play) or tonal (clear/harmonic, e.g. fear, desperation, or greeting).
 * @param frequencyData Decibel-scaled magnitudes for the bark's frequency bins
 * @param threshold Flatness at/above which a bark counts as harsh
 */
export function determineBarkTonality(
  frequencyData: ArrayLike<number>,
  threshold = HARSH_FLATNESS_THRESHOLD,
): Tonality {
  return spectralFlatness(frequencyData) >= threshold ? 'harsh' : 'tonal';
}

/**
 * A single bark event: a run of consecutive bark chunks, summarized by the
 * dominant pitch and tonality across that run plus its position in time.
 */
export interface BarkEvent {
  /** Index of the first chunk in this bark */
  startIndex: number;
  /** Index one past the last chunk in this bark */
  endIndex: number;
  pitch?: Pitch;
  tonality?: Tonality;
}

/**
 * Groups the per-chunk bark flags into discrete bark events, summarizing each
 * run of consecutive bark chunks by its most common pitch and tonality.
 * @param barksOccurred Per-chunk flags for whether a bark was present
 * @param pitches Per-chunk pitch readings, aligned with barksOccurred
 * @param tonalities Per-chunk tonality readings, aligned with barksOccurred
 */
export function segmentBarks(
  barksOccurred: boolean[],
  pitches: (Pitch | undefined)[],
  tonalities: (Tonality | undefined)[] = [],
): BarkEvent[] {
  const events: BarkEvent[] = [];
  let start = -1;

  const closeEvent = (end: number) => {
    if (start === -1) {
      return;
    }
    events.push({
      startIndex: start,
      endIndex: end,
      pitch: modeString(pitches.slice(start, end).filter(Boolean) as Pitch[]),
      tonality: modeString(
        tonalities.slice(start, end).filter(Boolean) as Tonality[],
      ),
    });
    start = -1;
  };

  barksOccurred.forEach((barkOccurred, i) => {
    if (barkOccurred && start === -1) {
      start = i;
    } else if (!barkOccurred) {
      closeEvent(i);
    }
  });
  closeEvent(barksOccurred.length);

  return events;
}

/**
 * Summarizes the timing of a sequence of bark events: how fast they repeat and
 * what that pace implies about the dog's arousal. Fast pulsing signals high
 * arousal (agitation/aggression); long, deliberate gaps signal lower arousal
 * (a lonely call-out or a relaxed greeting).
 * @param events The bark events to analyze
 * @param chunkMs Milliseconds of audio per chunk
 */
export function summarizeRhythm(
  events: BarkEvent[],
  chunkMs = CHUNK_DURATION_MS,
): { rhythm: Rhythm; meanGapMs?: number } {
  if (events.length <= 1) {
    return { rhythm: 'single' };
  }

  const gaps: number[] = [];
  for (let i = 1; i < events.length; i++) {
    gaps.push((events[i]!.startIndex - events[i - 1]!.endIndex) * chunkMs);
  }
  const meanGapMs = mean(gaps);

  let rhythm: Rhythm = 'measured';
  if (meanGapMs < RAPID_GAP_MS) {
    rhythm = 'rapid';
  } else if (meanGapMs > SPACED_GAP_MS) {
    rhythm = 'spaced';
  }

  return { rhythm, meanGapMs };
}

/**
 * The full read on a bout of barking: the best-guess type plus the underlying
 * acoustic traits and how confident we are. The traits let the UI explain
 * *why* it landed on a verdict rather than just naming one.
 */
export interface BarkTranslation {
  type: BarkType;
  /** 0..1 — how strongly the winning type beat the alternatives */
  confidence: number;
  pitch?: Pitch;
  tonality?: Tonality;
  rhythm: Rhythm;
  arousal: Arousal;
  barkCount: number;
}

interface BarkFeatures {
  pitch?: Pitch;
  rhythm: Rhythm;
  count: number;
}

/**
 * Scores each bark type against the acoustic features, following Morton's
 * structural-motivational rules but tuned to what we can actually measure.
 *
 * Pitch carries most of the signal: low-pitched bouts read as threat/guard
 * (alert), high-pitched bouts as excited play. Rhythm and count refine it —
 * fast pulsing and long strings lean agitated/excited, deliberate gaps lean
 * lonely/greeting.
 *
 * Tonality is intentionally absent. At our fftSize of 128 the spectral-flatness
 * estimate saturates (~0.9–0.99 for every clip we measured), so it can't
 * separate harsh from clear barks and would only bias the result. That also
 * makes distress (which needs a clear/tonal cue to tell a fearful yelp from an
 * excited yip) the least reliable verdict until we analyse at finer resolution.
 */
function scoreBarkType(features: BarkFeatures): Record<BarkType, number> {
  const { pitch, rhythm, count } = features;
  const score: Record<BarkType, number> = {
    alert: 0,
    distress: 0,
    greeting: 0,
    playful: 0,
  };

  // Pitch: low = threat/guard, high = excited/play, mid = in between
  if (pitch === 'low') {
    score.alert += 2;
    score.distress += 1;
    score.greeting += 0.5;
  } else if (pitch === 'mid') {
    score.alert += 1;
    score.playful += 1;
    score.greeting += 1;
  } else if (pitch === 'high') {
    score.playful += 2.5;
    score.distress += 0.5;
  }

  // Rhythm: fast = agitation, spaced = lonely call/greeting
  if (rhythm === 'rapid') {
    score.alert += 2;
    score.playful += 1;
  } else if (rhythm === 'measured') {
    score.greeting += 1;
    score.playful += 1;
  } else if (rhythm === 'spaced') {
    score.greeting += 1.5;
    score.distress += 1;
  } else if (rhythm === 'single') {
    score.distress += 0.5;
    score.greeting += 0.5;
  }

  // Count: a long string of barks leans agitated/excited, a pair leans social
  if (count === 2) {
    score.greeting += 1;
  } else if (count >= 4) {
    score.alert += 1;
    score.playful += 1;
  }

  return score;
}

/**
 * Maps inter-bark pace and tonality onto a coarse arousal level for display.
 */
function determineArousal(rhythm: Rhythm, tonality?: Tonality): Arousal {
  if (rhythm === 'rapid') {
    return 'intense';
  }
  if (rhythm === 'measured' || tonality === 'harsh') {
    return 'moderate';
  }
  return 'calm';
}

/**
 * Translates a bout of barking into a best-guess type plus the acoustic traits
 * behind it, by combining pitch, tonality, and rhythm. Returns undefined when
 * there were no barks to analyze.
 * @param barksOccurred Per-chunk flags for whether a bark was present
 * @param pitches Per-chunk pitch readings, aligned with barksOccurred
 * @param tonalities Per-chunk tonality readings, aligned with barksOccurred
 */
export function translateBark(
  barksOccurred: boolean[],
  pitches: (Pitch | undefined)[],
  tonalities: (Tonality | undefined)[] = [],
): BarkTranslation | undefined {
  const events = segmentBarks(barksOccurred, pitches, tonalities);
  if (events.length === 0) {
    return undefined;
  }

  const pitch = modeString(
    events.map((e) => e.pitch).filter(Boolean) as Pitch[],
  );
  const tonality = modeString(
    events.map((e) => e.tonality).filter(Boolean) as Tonality[],
  );
  const { rhythm } = summarizeRhythm(events);

  const score = scoreBarkType({ pitch, rhythm, count: events.length });

  const ranked = (Object.entries(score) as [BarkType, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [type, topScore] = ranked[0]!;
  const total = ranked.reduce((sum, [, value]) => sum + value, 0);
  const confidence = total > 0 ? topScore / total : 0;

  return {
    type,
    confidence,
    pitch,
    tonality,
    rhythm,
    arousal: determineArousal(rhythm, tonality),
    barkCount: events.length,
  };
}

/**
 * Uses the number of barks and their pitches (and, when available, tonality)
 * to determine a bark type. Thin wrapper over {@link translateBark} for
 * callers that only need the verdict.
 * @param barksOccurredData An array of booleans where the amplitude spiked
 * @param pitchData An array of pitches (low, mid, or high)
 * @param tonalityData An optional array of per-chunk tonality readings
 */
export function determineBarkType(
  barksOccurredData: boolean[],
  pitchData: (Pitch | undefined)[],
  tonalityData: (Tonality | undefined)[] = [],
): BarkType | undefined {
  return translateBark(barksOccurredData, pitchData, tonalityData)?.type;
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
