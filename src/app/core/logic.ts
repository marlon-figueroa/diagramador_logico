import type { Bit, GateKind } from './models';

export function bit(v: number | boolean | string): Bit {
  return v === 1 || v === true || v === '1' ? 1 : 0;
}

export function not(a: Bit): Bit {
  return a ? 0 : 1;
}

export function and(...bits: Bit[]): Bit {
  return bits.every((b) => b === 1) ? 1 : 0;
}

export function or(...bits: Bit[]): Bit {
  return bits.some((b) => b === 1) ? 1 : 0;
}

export function xor(...bits: Bit[]): Bit {
  let sum = 0;
  for (const b of bits) sum += b;
  return (sum % 2 === 1 ? 1 : 0) as Bit;
}

export function nand(...bits: Bit[]): Bit {
  return not(and(...bits));
}

export function nor(...bits: Bit[]): Bit {
  return not(or(...bits));
}

export function xnor(...bits: Bit[]): Bit {
  return not(xor(...bits));
}

export function evalGate(kind: GateKind, inputs: Bit[]): Bit {
  switch (kind) {
    case 'AND':
      return and(...inputs);
    case 'OR':
      return or(...inputs);
    case 'NOT':
      return not(inputs[0] ?? 0);
    case 'NAND':
      return nand(...inputs);
    case 'NOR':
      return nor(...inputs);
    case 'XOR':
      return xor(...inputs);
    case 'XNOR':
      return xnor(...inputs);
    case 'BUF':
    case 'IN':
    case 'CLK':
      return inputs[0] ?? 0;
    case 'VCC':
      return 1;
    case 'GND':
      return 0;
    default:
      return inputs[0] ?? 0;
  }
}

export function bitsToInt(bits: Bit[]): number {
  let value = 0;
  for (let i = 0; i < bits.length; i++) value += bits[i] << (bits.length - 1 - i);
  return value;
}

export function intToBits(value: number, width: number): Bit[] {
  const bits: Bit[] = [];
  for (let i = width - 1; i >= 0; i--) {
    bits.push(((value >> i) & 1) as Bit);
  }
  return bits;
}

export function grayCode(n: number): number {
  return n ^ (n >> 1);
}

export function graySequence(bits: number): number[] {
  const size = 1 << bits;
  return Array.from({ length: size }, (_, i) => grayCode(i));
}
