import { intToBits } from './logic';

export type ClockMode = 12 | 24;

export const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;

const PATTERNS: Record<number, string> = {
  0: '1111110',
  1: '0110000',
  2: '1101101',
  3: '1111001',
  4: '0110011',
  5: '1011011',
  6: '1011111',
  7: '1110000',
  8: '1111111',
  9: '1111011',
};

export interface ClockState {
  hours: number;
  minutes: number;
  seconds: number;
  pm: boolean;
}

export interface ClockDigit {
  id: string;
  value: number;
  segments: { id: string; on: boolean }[];
  bits: { id: string; on: boolean }[];
}

export function clampTime(mode: ClockMode, hours: number, minutes: number, seconds: number, pm = false): ClockState {
  const mins = wrap(minutes, 60);
  const secs = wrap(seconds, 60);
  if (mode === 24) {
    return { hours: wrap(hours, 24), minutes: mins, seconds: secs, pm: false };
  }
  let h = hours;
  if (h < 1) h = 12;
  if (h > 12) h = ((h - 1) % 12) + 1;
  return { hours: h, minutes: mins, seconds: secs, pm };
}

export function tickClock(state: ClockState, mode: ClockMode): ClockState {
  let { hours, minutes, seconds, pm } = state;
  seconds += 1;
  if (seconds < 60) return { hours, minutes, seconds, pm };
  seconds = 0;
  minutes += 1;
  if (minutes < 60) return { hours, minutes, seconds, pm };
  minutes = 0;
  if (mode === 24) {
    hours = (hours + 1) % 24;
    return { hours, minutes, seconds, pm: false };
  }
  if (hours === 11) {
    hours = 12;
    pm = !pm;
  } else if (hours === 12) {
    hours = 1;
  } else {
    hours += 1;
  }
  return { hours, minutes, seconds, pm };
}

export function clockDigits(state: ClockState): ClockDigit[] {
  const values = [
    { id: 'H1', value: Math.floor(state.hours / 10) },
    { id: 'H0', value: state.hours % 10 },
    { id: 'M1', value: Math.floor(state.minutes / 10) },
    { id: 'M0', value: state.minutes % 10 },
    { id: 'S1', value: Math.floor(state.seconds / 10) },
    { id: 'S0', value: state.seconds % 10 },
  ];
  return values.map((item) => ({
    ...item,
    segments: SEGMENTS.map((id, i) => ({ id, on: (PATTERNS[item.value] ?? '0000000')[i] === '1' })),
    bits: intToBits(item.value, 4).map((bit, i) => ({ id: `Q${3 - i}`, on: bit === 1 })),
  }));
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function wrap(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  const n = Math.trunc(value);
  return ((n % max) + max) % max;
}
