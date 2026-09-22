import type { CellValue, GateKind, Netlist, NetNode, NetWire } from './models';
import { graySequence } from './logic';

export const VAR_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export interface KMapCell {
  minterm: number;
  row: number;
  col: number;
  map: number;
  value: CellValue;
}

export interface KMapLayout {
  variables: number;
  maps: number;
  rows: number;
  cols: number;
  rowBits: number;
  colBits: number;
  rowLabels: string[];
  colLabels: string[];
  mapLabels: string[];
  cells: KMapCell[];
}

export interface PrimeImplicant {
  pattern: string;
  minterms: number[];
  essential: boolean;
}

export interface MinimizedFunction {
  sop: string;
  pos: string;
  primes: PrimeImplicant[];
  sopPrimes: PrimeImplicant[];
  posPrimes: PrimeImplicant[];
}

export type KMapForm = 'sop' | 'pos';

interface Literal {
  name: string;
  index: number;
  complemented: boolean;
}

function bitsOf(n: number, width: number): string {
  return n.toString(2).padStart(width, '0');
}

function labelBits(names: readonly string[], values: number[]): string {
  return names.map((name, i) => `${name}=${values[i]}`).join('');
}

export function buildLayout(variables: number): KMapLayout {
  const vars = VAR_NAMES.slice(0, variables);
  const maps = variables >= 5 ? (variables === 5 ? 2 : 4) : 1;
  const rowBits = variables <= 3 ? 1 : 2;
  const colBits = variables === 2 ? 1 : 2;
  const rows = 1 << rowBits;
  const cols = 1 << colBits;
  const rowGray = graySequence(rowBits);
  const colGray = graySequence(colBits);

  const rowNames =
    variables <= 3 ? vars.slice(0, 1) : variables === 4 ? vars.slice(0, 2) : variables === 5 ? vars.slice(1, 3) : vars.slice(2, 4);
  const colNames =
    variables === 2 ? vars.slice(1, 2) : variables === 3 ? vars.slice(1, 3) : variables === 4 ? vars.slice(2, 4) : variables === 5 ? vars.slice(3, 5) : vars.slice(4, 6);

  const mapLabels =
    variables === 6
      ? ['AB=00', 'AB=01', 'AB=11', 'AB=10']
      : variables === 5
        ? ['A=0', 'A=1']
        : [vars.join('')];

  const cells: KMapCell[] = [];
  for (let map = 0; map < maps; map++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rowVal = rowGray[r];
        const colVal = colGray[c];
        let minterm = 0;
        if (variables <= 2) {
          minterm = (rowVal << 1) | colVal;
          if (variables === 1) minterm = colVal;
        } else if (variables === 3) {
          minterm = (rowVal << 2) | colVal;
        } else if (variables === 4) {
          minterm = (rowVal << 2) | colVal;
        } else if (variables === 5) {
          minterm = (map << 4) | (rowVal << 2) | colVal;
        } else {
          const ab = [0, 1, 3, 2][map];
          minterm = (ab << 4) | (rowVal << 2) | colVal;
        }
        cells.push({ minterm, row: r, col: c, map, value: 0 });
      }
    }
  }

  return {
    variables,
    maps,
    rows,
    cols,
    rowBits,
    colBits,
    rowLabels: rowGray.map((v) => labelBits(rowNames, bitsOf(v, rowBits).split('').map(Number))),
    colLabels: colGray.map((v) => labelBits(colNames, bitsOf(v, colBits).split('').map(Number))),
    mapLabels,
    cells,
  };
}

function combine(a: string, b: string): string | null {
  let diff = 0;
  let out = '';
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) out += a[i];
    else {
      diff += 1;
      out += '-';
    }
  }
  return diff === 1 ? out : null;
}

function covers(pattern: string, minterm: number): boolean {
  const bits = bitsOf(minterm, pattern.length);
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== '-' && pattern[i] !== bits[i]) return false;
  }
  return true;
}

function termOf(pattern: string, vars: readonly string[], polarity: 'sop' | 'pos'): string {
  const parts: string[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '-') continue;
    if (polarity === 'sop') parts.push(ch === '1' ? vars[i] : `${vars[i]}'`);
    else parts.push(ch === '0' ? vars[i] : `${vars[i]}'`);
  }
  if (polarity === 'sop') return parts.length ? parts.join('') : '1';
  if (!parts.length) return '0';
  return parts.length === 1 ? parts[0] : `(${parts.join('+')})`;
}

function quineMcCluskey(variables: number, ones: number[], dontCares: number[]): PrimeImplicant[] {
  const universe = [...new Set([...ones, ...dontCares])].sort((a, b) => a - b);
  if (universe.length === 0) return [];
  if (universe.length === 1 << variables && ones.length === 1 << variables) {
    return [{ pattern: '-'.repeat(variables), minterms: ones.slice(), essential: true }];
  }

  let groups = new Map<string, number[]>();
  for (const m of universe) groups.set(bitsOf(m, variables), [m]);

  const all: { pattern: string; minterms: number[]; used: boolean }[] = [];
  while (groups.size) {
    const next = new Map<string, number[]>();
    const used = new Set<string>();
    const keys = [...groups.keys()];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const merged = combine(keys[i], keys[j]);
        if (!merged) continue;
        used.add(keys[i]);
        used.add(keys[j]);
        const terms = [...new Set([...(groups.get(keys[i]) ?? []), ...(groups.get(keys[j]) ?? [])])];
        next.set(merged, terms);
      }
    }
    for (const [pattern, minterms] of groups) {
      all.push({ pattern, minterms, used: used.has(pattern) });
    }
    groups = next;
  }

  const primes = all
    .filter((item) => !item.used)
    .map((item) => ({
      pattern: item.pattern,
      minterms: item.minterms.filter((m) => ones.includes(m)),
      essential: false,
    }))
    .filter((item) => item.minterms.length > 0);

  const unique: PrimeImplicant[] = [];
  for (const p of primes) {
    if (!unique.some((u) => u.pattern === p.pattern)) unique.push(p);
  }

  const uncovered = new Set(ones);
  for (const m of ones) {
    const covering = unique.filter((p) => covers(p.pattern, m));
    if (covering.length === 1) covering[0].essential = true;
  }
  for (const p of unique.filter((x) => x.essential)) {
    p.minterms.forEach((m) => uncovered.delete(m));
  }

  const remaining = unique.filter((p) => !p.essential);
  while (uncovered.size) {
    remaining.sort((a, b) => {
      const ca = a.minterms.filter((m) => uncovered.has(m)).length;
      const cb = b.minterms.filter((m) => uncovered.has(m)).length;
      return cb - ca || a.pattern.replace(/-/g, '').length - b.pattern.replace(/-/g, '').length;
    });
    const best = remaining.shift();
    if (!best || !best.minterms.some((m) => uncovered.has(m))) break;
    best.essential = true;
    best.minterms.forEach((m) => uncovered.delete(m));
  }

  return unique.filter((p) => p.essential || p.minterms.some((m) => ones.includes(m)));
}

export function minimize(variables: number, values: Map<number, CellValue>): MinimizedFunction {
  const ones: number[] = [];
  const zeros: number[] = [];
  const dontCares: number[] = [];
  const max = 1 << variables;
  for (let i = 0; i < max; i++) {
    const v = values.get(i) ?? 0;
    if (v === 1) ones.push(i);
    else if (v === 'X') dontCares.push(i);
    else zeros.push(i);
  }

  const vars = VAR_NAMES.slice(0, variables);
  if (ones.length === 0) {
    return { sop: '0', pos: zeros.length === 0 ? 'X' : '0', primes: [], sopPrimes: [], posPrimes: [] };
  }
  if (ones.length + dontCares.length === max && ones.length > 0) {
    const tautology = [{ pattern: '-'.repeat(variables), minterms: ones, essential: true }];
    return { sop: '1', pos: '1', primes: tautology, sopPrimes: tautology, posPrimes: tautology };
  }

  const sopPrimes = quineMcCluskey(variables, ones, dontCares);
  const posPrimes = quineMcCluskey(variables, zeros, dontCares);
  const sopEssential = sopPrimes.filter((p) => p.essential);
  const posEssential = posPrimes.filter((p) => p.essential);
  const sop = sopEssential.map((p) => termOf(p.pattern, vars, 'sop')).join(' + ');
  const pos = posEssential.map((p) => termOf(p.pattern, vars, 'pos')).join('');

  return {
    sop: sop || '0',
    pos: pos || (zeros.length ? '1' : '0'),
    primes: sopEssential,
    sopPrimes: sopEssential,
    posPrimes: posEssential,
  };
}

export function cycleCell(value: CellValue): CellValue {
  if (value === 0) return 1;
  if (value === 1) return 'X';
  return 0;
}

function literalsOf(pattern: string, vars: readonly string[], form: KMapForm): Literal[] {
  const literals: Literal[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '-') continue;
    const complemented = form === 'sop' ? ch === '0' : ch === '1';
    literals.push({ name: vars[i], index: i, complemented });
  }
  return literals;
}

function constantNet(kind: 'VCC' | 'GND'): Netlist {
  return {
    nodes: [
      { id: kind.toLowerCase(), kind, x: 80, y: 80, label: kind },
      { id: 'Y', kind: 'OUT', x: 320, y: 80, label: 'Y' },
    ],
    wires: [{ from: kind.toLowerCase(), to: 'Y', fromPort: 'out', toPort: 'in1' }],
  };
}

function sourceId(lit: Literal): string {
  return lit.complemented ? `not_${lit.name}` : `in_${lit.name}`;
}

export function diagramMinimized(variables: number, result: MinimizedFunction, form: KMapForm): Netlist {
  const expression = form === 'sop' ? result.sop : result.pos;
  if (expression === 'X' || expression === '') return { nodes: [], wires: [] };
  if (expression === '0') return constantNet('GND');
  if (expression === '1') return constantNet('VCC');

  const vars = VAR_NAMES.slice(0, variables);
  const primes = form === 'sop' ? result.sopPrimes : result.posPrimes;
  const terms = primes.map((p) => literalsOf(p.pattern, vars, form));
  const used = [...new Set(terms.flatMap((term) => term.map((lit) => lit.index)))].sort((a, b) => a - b);
  const nodes: NetNode[] = [];
  const wires: NetWire[] = [];
  const row = (i: number) => 20 + i * 66;

  used.forEach((index, i) => {
    const name = vars[index];
    nodes.push({ id: `in_${name}`, kind: 'IN', x: 36, y: row(i), label: name });
  });

  const needsNot = new Set(terms.flatMap((term) => term.filter((lit) => lit.complemented).map((lit) => lit.index)));
  used.forEach((index, i) => {
    if (!needsNot.has(index)) return;
    const name = vars[index];
    nodes.push({ id: `not_${name}`, kind: 'NOT', x: 196, y: row(i), label: `${name}'` });
    wires.push({ from: `in_${name}`, to: `not_${name}`, fromPort: 'out', toPort: 'in1' });
  });

  const termKind: GateKind = form === 'sop' ? 'AND' : 'OR';
  const combineKind: GateKind = form === 'sop' ? 'OR' : 'AND';
  const termIds: string[] = [];

  terms.forEach((lits, t) => {
    if (!lits.length) {
      const id = form === 'sop' ? 'vcc' : 'gnd';
      if (!nodes.some((n) => n.id === id)) {
        nodes.push({ id, kind: form === 'sop' ? 'VCC' : 'GND', x: 196, y: 36, label: form === 'sop' ? 'VCC' : 'GND' });
      }
      termIds.push(id);
      return;
    }
    if (lits.length === 1) {
      termIds.push(sourceId(lits[0]));
      return;
    }
    const id = `term_${t}`;
    nodes.push({ id, kind: termKind, x: 380, y: row(t), label: termKind, inputs: lits.length });
    lits.forEach((lit, li) => {
      wires.push({ from: sourceId(lit), to: id, fromPort: 'out', toPort: `in${li + 1}` });
    });
    termIds.push(id);
  });

  if (!termIds.length) return { nodes, wires };

  if (termIds.length === 1) {
    const src = nodes.find((n) => n.id === termIds[0]);
    nodes.push({ id: 'Y', kind: 'OUT', x: 580, y: src?.y ?? 36, label: 'Y' });
    wires.push({ from: termIds[0], to: 'Y', fromPort: 'out', toPort: 'in1' });
    return { nodes, wires };
  }

  const midY = row((termIds.length - 1) / 2);
  nodes.push({ id: 'join', kind: combineKind, x: 580, y: midY, label: combineKind, inputs: termIds.length });
  termIds.forEach((id, i) => {
    wires.push({ from: id, to: 'join', fromPort: 'out', toPort: `in${i + 1}` });
  });
  nodes.push({ id: 'Y', kind: 'OUT', x: 760, y: midY, label: 'Y' });
  wires.push({ from: 'join', to: 'Y', fromPort: 'out', toPort: 'in1' });
  return { nodes, wires };
}
