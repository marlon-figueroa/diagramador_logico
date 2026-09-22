import type { Bit, FlipFlopForm, Netlist } from './models';
import { not } from './logic';

function pair(from: string, to: string, fromPort = 'out', toPort = 'in1') {
  return { from, to, fromPort, toPort };
}

function srNorNet(): Netlist {
  return {
    nodes: [
      { id: 'S', kind: 'IN', x: 40, y: 60, label: 'S' },
      { id: 'R', kind: 'IN', x: 40, y: 220, label: 'R' },
      { id: 'N1', kind: 'NOR', x: 260, y: 60, label: 'NOR' },
      { id: 'N2', kind: 'NOR', x: 260, y: 220, label: 'NOR' },
      { id: 'Q', kind: 'OUT', x: 500, y: 60, label: 'Q' },
      { id: 'Qn', kind: 'OUT', x: 500, y: 220, label: "Q'" },
    ],
    wires: [
      pair('S', 'N1', 'out', 'in1'),
      pair('N2', 'N1', 'out', 'in2'),
      pair('R', 'N2', 'out', 'in1'),
      pair('N1', 'N2', 'out', 'in2'),
      pair('N1', 'Q'),
      pair('N2', 'Qn'),
    ],
  };
}

function srNandNet(): Netlist {
  return {
    nodes: [
      { id: 'Sn', kind: 'IN', x: 40, y: 60, label: "S'" },
      { id: 'Rn', kind: 'IN', x: 40, y: 220, label: "R'" },
      { id: 'N1', kind: 'NAND', x: 260, y: 60, label: 'NAND' },
      { id: 'N2', kind: 'NAND', x: 260, y: 220, label: 'NAND' },
      { id: 'Q', kind: 'OUT', x: 500, y: 60, label: 'Q' },
      { id: 'Qn', kind: 'OUT', x: 500, y: 220, label: "Q'" },
    ],
    wires: [
      pair('Sn', 'N1', 'out', 'in1'),
      pair('N2', 'N1', 'out', 'in2'),
      pair('Rn', 'N2', 'out', 'in1'),
      pair('N1', 'N2', 'out', 'in2'),
      pair('N1', 'Q'),
      pair('N2', 'Qn'),
    ],
  };
}

function gatedSrNet(): Netlist {
  return {
    nodes: [
      { id: 'S', kind: 'IN', x: 30, y: 40, label: 'S' },
      { id: 'R', kind: 'IN', x: 30, y: 160, label: 'R' },
      { id: 'EN', kind: 'IN', x: 30, y: 280, label: 'EN' },
      { id: 'A1', kind: 'AND', x: 200, y: 40, label: 'AND' },
      { id: 'A2', kind: 'AND', x: 200, y: 180, label: 'AND' },
      { id: 'N1', kind: 'NOR', x: 380, y: 40, label: 'NOR' },
      { id: 'N2', kind: 'NOR', x: 380, y: 180, label: 'NOR' },
      { id: 'Q', kind: 'OUT', x: 560, y: 40, label: 'Q' },
      { id: 'Qn', kind: 'OUT', x: 560, y: 180, label: "Q'" },
    ],
    wires: [
      pair('S', 'A1', 'out', 'in1'),
      pair('EN', 'A1', 'out', 'in2'),
      pair('R', 'A2', 'out', 'in1'),
      pair('EN', 'A2', 'out', 'in2'),
      pair('A1', 'N1', 'out', 'in1'),
      pair('N2', 'N1', 'out', 'in2'),
      pair('A2', 'N2', 'out', 'in1'),
      pair('N1', 'N2', 'out', 'in2'),
      pair('N1', 'Q'),
      pair('N2', 'Qn'),
    ],
  };
}

function gatedDNet(): Netlist {
  return {
    nodes: [
      { id: 'D', kind: 'IN', x: 30, y: 60, label: 'D' },
      { id: 'EN', kind: 'IN', x: 30, y: 220, label: 'EN' },
      { id: 'ND', kind: 'NOT', x: 180, y: 140, label: "D'" },
      { id: 'A1', kind: 'AND', x: 320, y: 40, label: 'AND' },
      { id: 'A2', kind: 'AND', x: 320, y: 180, label: 'AND' },
      { id: 'N1', kind: 'NOR', x: 480, y: 40, label: 'NOR' },
      { id: 'N2', kind: 'NOR', x: 480, y: 180, label: 'NOR' },
      { id: 'Q', kind: 'OUT', x: 650, y: 40, label: 'Q' },
      { id: 'Qn', kind: 'OUT', x: 650, y: 180, label: "Q'" },
    ],
    wires: [
      pair('D', 'ND'),
      pair('D', 'A1', 'out', 'in1'),
      pair('EN', 'A1', 'out', 'in2'),
      pair('ND', 'A2', 'out', 'in1'),
      pair('EN', 'A2', 'out', 'in2'),
      pair('A1', 'N1', 'out', 'in1'),
      pair('N2', 'N1', 'out', 'in2'),
      pair('A2', 'N2', 'out', 'in1'),
      pair('N1', 'N2', 'out', 'in2'),
      pair('N1', 'Q'),
      pair('N2', 'Qn'),
    ],
  };
}

function jkNet(): Netlist {
  return {
    nodes: [
      { id: 'J', kind: 'IN', x: 30, y: 40, label: 'J' },
      { id: 'K', kind: 'IN', x: 30, y: 160, label: 'K' },
      { id: 'CLK', kind: 'CLK', x: 30, y: 280, label: 'CLK' },
      { id: 'A1', kind: 'AND', x: 220, y: 40, label: 'AND', inputs: 3 },
      { id: 'A2', kind: 'AND', x: 220, y: 180, label: 'AND', inputs: 3 },
      { id: 'N1', kind: 'NOR', x: 420, y: 40, label: 'NOR' },
      { id: 'N2', kind: 'NOR', x: 420, y: 180, label: 'NOR' },
      { id: 'Q', kind: 'OUT', x: 620, y: 40, label: 'Q' },
      { id: 'Qn', kind: 'OUT', x: 620, y: 180, label: "Q'" },
    ],
    wires: [
      pair('J', 'A1', 'out', 'in1'),
      pair('CLK', 'A1', 'out', 'in2'),
      pair('Qn', 'A1', 'out', 'in3'),
      pair('K', 'A2', 'out', 'in1'),
      pair('CLK', 'A2', 'out', 'in2'),
      pair('Q', 'A2', 'out', 'in3'),
      pair('A1', 'N1', 'out', 'in1'),
      pair('N2', 'N1', 'out', 'in2'),
      pair('A2', 'N2', 'out', 'in1'),
      pair('N1', 'N2', 'out', 'in2'),
      pair('N1', 'Q'),
      pair('N2', 'Qn'),
    ],
  };
}

export const FLIPFLOPS: FlipFlopForm[] = [
  {
    id: 'sr-nor',
    name: 'Latch SR (NOR cruzado)',
    family: 'latch',
    trigger: 'async',
    description: 'Biestable asíncrono con dos NOR. S=R=1 es estado inválido.',
    inputs: ['S', 'R'],
    equation: "Q⁺ = S + R'Q   (S·R = 0)",
    nextQ: (q, i) => {
      if (i['S'] && i['R']) return 'invalid';
      if (i['S']) return 1;
      if (i['R']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { S: 0, R: 0 }, outputs: { 'Q+': 'Q' }, note: 'Hold' },
      { inputs: { S: 0, R: 1 }, outputs: { 'Q+': 0 }, note: 'Reset' },
      { inputs: { S: 1, R: 0 }, outputs: { 'Q+': 1 }, note: 'Set' },
      { inputs: { S: 1, R: 1 }, outputs: { 'Q+': 'X' }, note: 'Inválido' },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { S: 0, R: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { S: 1, R: 0 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { S: 0, R: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { S: 'X', R: 0 } },
    ],
    netlist: srNorNet(),
  },
  {
    id: 'sr-nand',
    name: 'Latch SR (NAND cruzado)',
    family: 'latch',
    trigger: 'async',
    description: 'Versión activa en bajo. S\'=R\'=0 es inválido; reposo es 1,1.',
    inputs: ["S'", "R'"],
    equation: "Q⁺ = S + R'Q   con entradas activas en bajo",
    nextQ: (q, i) => {
      const s = not(i["S'"] ?? 1);
      const r = not(i["R'"] ?? 1);
      if (s && r) return 'invalid';
      if (s) return 1;
      if (r) return 0;
      return q;
    },
    characteristic: [
      { inputs: { "S'": 1, "R'": 1 }, outputs: { 'Q+': 'Q' }, note: 'Hold' },
      { inputs: { "S'": 1, "R'": 0 }, outputs: { 'Q+': 0 }, note: 'Reset' },
      { inputs: { "S'": 0, "R'": 1 }, outputs: { 'Q+': 1 }, note: 'Set' },
      { inputs: { "S'": 0, "R'": 0 }, outputs: { 'Q+': 'X' }, note: 'Inválido' },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { "S'": 1, "R'": 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { "S'": 0, "R'": 1 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { "S'": 1, "R'": 0 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { "S'": 'X', "R'": 1 } },
    ],
    netlist: srNandNet(),
  },
  {
    id: 'sr-gated',
    name: 'Latch SR habilitado',
    family: 'latch',
    trigger: 'level',
    description: 'SR controlado por EN. Solo cambia mientras EN=1.',
    inputs: ['S', 'R', 'EN'],
    equation: "EN=1 → Q⁺ = S + R'Q",
    nextQ: (q, i) => {
      if (!i['EN']) return q;
      if (i['S'] && i['R']) return 'invalid';
      if (i['S']) return 1;
      if (i['R']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { EN: 0, S: 'X', R: 'X' }, outputs: { 'Q+': 'Q' }, note: 'Transparente off' },
      { inputs: { EN: 1, S: 0, R: 0 }, outputs: { 'Q+': 'Q' } },
      { inputs: { EN: 1, S: 0, R: 1 }, outputs: { 'Q+': 0 } },
      { inputs: { EN: 1, S: 1, R: 0 }, outputs: { 'Q+': 1 } },
      { inputs: { EN: 1, S: 1, R: 1 }, outputs: { 'Q+': 'X' } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { S: 0, R: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { S: 1, R: 0 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { S: 0, R: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { S: 'X', R: 0 } },
    ],
    netlist: gatedSrNet(),
  },
  {
    id: 'd-latch',
    name: 'Latch D (transparente)',
    family: 'latch',
    trigger: 'level',
    description: 'Cuando EN=1, Q sigue a D. Evita el estado inválido del SR.',
    inputs: ['D', 'EN'],
    equation: 'EN=1 → Q⁺ = D    EN=0 → Q⁺ = Q',
    nextQ: (q, i) => (i['EN'] ? i['D'] : q),
    characteristic: [
      { inputs: { EN: 0, D: 'X' }, outputs: { 'Q+': 'Q' }, note: 'Hold' },
      { inputs: { EN: 1, D: 0 }, outputs: { 'Q+': 0 }, note: 'Transparente' },
      { inputs: { EN: 1, D: 1 }, outputs: { 'Q+': 1 }, note: 'Transparente' },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { D: 1 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { D: 1 } },
    ],
    netlist: gatedDNet(),
  },
  {
    id: 'sr-ff',
    name: 'Flip-flop SR por flanco',
    family: 'flipflop',
    trigger: 'rising',
    description: 'SR sincronizado. Solo muestrea S y R en el flanco de subida.',
    inputs: ['S', 'R', 'CLK'],
    equation: "↑CLK → Q⁺ = S + R'Q",
    nextQ: (q, i, edge) => {
      if (!edge) return q;
      if (i['S'] && i['R']) return 'invalid';
      if (i['S']) return 1;
      if (i['R']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { CLK: '↑', S: 0, R: 0 }, outputs: { 'Q+': 'Q' } },
      { inputs: { CLK: '↑', S: 0, R: 1 }, outputs: { 'Q+': 0 } },
      { inputs: { CLK: '↑', S: 1, R: 0 }, outputs: { 'Q+': 1 } },
      { inputs: { CLK: '↑', S: 1, R: 1 }, outputs: { 'Q+': 'X' } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { S: 0, R: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { S: 1, R: 0 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { S: 0, R: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { S: 'X', R: 0 } },
    ],
    netlist: gatedSrNet(),
  },
  {
    id: 'jk-ff',
    name: 'Flip-flop JK',
    family: 'flipflop',
    trigger: 'rising',
    description: 'Resuelve el inválido del SR: J=K=1 conmuta (toggle).',
    inputs: ['J', 'K', 'CLK'],
    equation: "Q⁺ = J·Q' + K'·Q",
    nextQ: (q, i, edge) => {
      if (!edge) return q;
      if (i['J'] && i['K']) return q ? 0 : 1;
      if (i['J']) return 1;
      if (i['K']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { J: 0, K: 0 }, outputs: { 'Q+': 'Q' }, note: 'Hold' },
      { inputs: { J: 0, K: 1 }, outputs: { 'Q+': 0 }, note: 'Reset' },
      { inputs: { J: 1, K: 0 }, outputs: { 'Q+': 1 }, note: 'Set' },
      { inputs: { J: 1, K: 1 }, outputs: { 'Q+': "Q'" }, note: 'Toggle' },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { J: 0, K: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { J: 1, K: 'X' } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { J: 'X', K: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { J: 'X', K: 0 } },
    ],
    netlist: jkNet(),
  },
  {
    id: 'jk-ms',
    name: 'JK maestro-esclavo',
    family: 'flipflop',
    trigger: 'master-slave',
    description: 'Maestro transparente en CLK=1; esclavo copia en CLK=0. Evita carrera.',
    inputs: ['J', 'K', 'CLK'],
    equation: "Maestro en CLK=1, esclavo en CLK=0. Q⁺ = JQ' + K'Q",
    nextQ: (q, i, edge) => {
      if (!edge) return q;
      if (i['J'] && i['K']) return q ? 0 : 1;
      if (i['J']) return 1;
      if (i['K']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { J: 0, K: 0, CLK: '1→0' }, outputs: { 'Q+': 'Q' } },
      { inputs: { J: 0, K: 1, CLK: '1→0' }, outputs: { 'Q+': 0 } },
      { inputs: { J: 1, K: 0, CLK: '1→0' }, outputs: { 'Q+': 1 } },
      { inputs: { J: 1, K: 1, CLK: '1→0' }, outputs: { 'Q+': "Q'" } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { J: 0, K: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { J: 1, K: 'X' } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { J: 'X', K: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { J: 'X', K: 0 } },
    ],
    netlist: jkNet(),
  },
  {
    id: 'd-ff',
    name: 'Flip-flop D flanco de subida',
    family: 'flipflop',
    trigger: 'rising',
    description: 'Registro de 1 bit. Q⁺ = D en el flanco positivo.',
    inputs: ['D', 'CLK'],
    equation: '↑CLK → Q⁺ = D',
    nextQ: (q, i, edge) => (edge ? i['D'] : q),
    characteristic: [
      { inputs: { D: 0, CLK: '↑' }, outputs: { 'Q+': 0 } },
      { inputs: { D: 1, CLK: '↑' }, outputs: { 'Q+': 1 } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { D: 1 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { D: 1 } },
    ],
    netlist: gatedDNet(),
  },
  {
    id: 'd-ff-neg',
    name: 'Flip-flop D flanco de bajada',
    family: 'flipflop',
    trigger: 'falling',
    description: 'Igual que el D, pero muestrea en el flanco negativo.',
    inputs: ['D', 'CLK'],
    equation: '↓CLK → Q⁺ = D',
    nextQ: (q, i, edge) => (edge ? i['D'] : q),
    characteristic: [
      { inputs: { D: 0, CLK: '↓' }, outputs: { 'Q+': 0 } },
      { inputs: { D: 1, CLK: '↓' }, outputs: { 'Q+': 1 } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { D: 1 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { D: 0 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { D: 1 } },
    ],
    netlist: gatedDNet(),
  },
  {
    id: 't-ff',
    name: 'Flip-flop T',
    family: 'flipflop',
    trigger: 'rising',
    description: 'Toggle: si T=1 conmuta; si T=0 mantiene. Base de contadores.',
    inputs: ['T', 'CLK'],
    equation: 'Q⁺ = T ⊕ Q',
    nextQ: (q, i, edge) => {
      if (!edge) return q;
      return i['T'] ? ((q ? 0 : 1) as Bit) : q;
    },
    characteristic: [
      { inputs: { T: 0 }, outputs: { 'Q+': 'Q' }, note: 'Hold' },
      { inputs: { T: 1 }, outputs: { 'Q+': "Q'" }, note: 'Toggle' },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { T: 0 } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { T: 1 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { T: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { T: 0 } },
    ],
    netlist: {
      nodes: [
        { id: 'T', kind: 'IN', x: 40, y: 60, label: 'T' },
        { id: 'CLK', kind: 'CLK', x: 40, y: 200, label: 'CLK' },
        { id: 'X', kind: 'XOR', x: 260, y: 80, label: 'XOR' },
        { id: 'D', kind: 'FF', x: 440, y: 80, label: 'D-FF' },
        { id: 'Q', kind: 'OUT', x: 640, y: 80, label: 'Q' },
      ],
      wires: [
        pair('T', 'X', 'out', 'in1'),
        pair('Q', 'X', 'out', 'in2'),
        pair('X', 'D'),
        pair('CLK', 'D', 'out', 'in2'),
        pair('D', 'Q'),
      ],
    },
  },
  {
    id: 'd-async',
    name: 'D con Preset y Clear',
    family: 'flipflop',
    trigger: 'rising',
    description: 'PRE y CLR asíncronos activos en alto. Dominan al reloj.',
    inputs: ['D', 'CLK', 'PRE', 'CLR'],
    equation: 'PRE=1 → Q=1; CLR=1 → Q=0; si no, ↑CLK → Q=D',
    nextQ: (q, i, edge) => {
      if (i['PRE'] && i['CLR']) return 'invalid';
      if (i['PRE']) return 1;
      if (i['CLR']) return 0;
      return edge ? i['D'] : q;
    },
    characteristic: [
      { inputs: { PRE: 1, CLR: 0 }, outputs: { Q: 1 }, note: 'Asíncrono' },
      { inputs: { PRE: 0, CLR: 1 }, outputs: { Q: 0 }, note: 'Asíncrono' },
      { inputs: { PRE: 1, CLR: 1 }, outputs: { Q: 'X' }, note: 'Inválido' },
      { inputs: { PRE: 0, CLR: 0, D: 0, CLK: '↑' }, outputs: { 'Q+': 0 } },
      { inputs: { PRE: 0, CLR: 0, D: 1, CLK: '↑' }, outputs: { 'Q+': 1 } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { D: 0, PRE: 0, CLR: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { D: 1, PRE: 'X', CLR: 0 } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { D: 0, PRE: 0, CLR: 'X' } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { D: 1, PRE: 'X', CLR: 0 } },
    ],
    netlist: gatedDNet(),
  },
  {
    id: 'jk-async',
    name: 'JK con Preset y Clear',
    family: 'flipflop',
    trigger: 'rising',
    description: 'JK de flanco con arranque asíncrono. Forma completa de 74xx.',
    inputs: ['J', 'K', 'CLK', 'PRE', 'CLR'],
    equation: 'PRE/CLR asíncronos; si no, Q⁺ = JQ\' + K\'Q',
    nextQ: (q, i, edge) => {
      if (i['PRE'] && i['CLR']) return 'invalid';
      if (i['PRE']) return 1;
      if (i['CLR']) return 0;
      if (!edge) return q;
      if (i['J'] && i['K']) return q ? 0 : 1;
      if (i['J']) return 1;
      if (i['K']) return 0;
      return q;
    },
    characteristic: [
      { inputs: { PRE: 1, CLR: 0 }, outputs: { Q: 1 } },
      { inputs: { PRE: 0, CLR: 1 }, outputs: { Q: 0 } },
      { inputs: { PRE: 0, CLR: 0, J: 1, K: 1, CLK: '↑' }, outputs: { 'Q+': "Q'" } },
    ],
    excitation: [
      { inputs: { Q: 0, 'Q+': 0 }, outputs: { J: 0, K: 'X' } },
      { inputs: { Q: 0, 'Q+': 1 }, outputs: { J: 1, K: 'X' } },
      { inputs: { Q: 1, 'Q+': 0 }, outputs: { J: 'X', K: 1 } },
      { inputs: { Q: 1, 'Q+': 1 }, outputs: { J: 'X', K: 0 } },
    ],
    netlist: jkNet(),
  },
];

export function findFlipFlop(id: string): FlipFlopForm {
  return FLIPFLOPS.find((ff) => ff.id === id) ?? FLIPFLOPS[0];
}

