import type { Bit, IcDefinition, Netlist } from './models';
import { and, bit, bitsToInt, intToBits, not, or, xor } from './logic';

function pins(labels: string[], side: 'left' | 'right'): IcDefinition['inputs'] {
  return labels.map((label) => ({ id: label, label, side }));
}

function pair(from: string, to: string, fromPort = 'out', toPort = 'in1'): Netlist['wires'][number] {
  return { from, to, fromPort, toPort };
}

function halfAdderNet(): Netlist {
  return {
    nodes: [
      { id: 'A', kind: 'IN', x: 40, y: 80, label: 'A' },
      { id: 'B', kind: 'IN', x: 40, y: 200, label: 'B' },
      { id: 'XOR', kind: 'XOR', x: 240, y: 80, label: 'XOR' },
      { id: 'AND', kind: 'AND', x: 240, y: 220, label: 'AND' },
      { id: 'S', kind: 'OUT', x: 460, y: 80, label: 'S' },
      { id: 'C', kind: 'OUT', x: 460, y: 220, label: 'C' },
    ],
    wires: [
      pair('A', 'XOR', 'out', 'in1'),
      pair('B', 'XOR', 'out', 'in2'),
      pair('A', 'AND', 'out', 'in1'),
      pair('B', 'AND', 'out', 'in2'),
      pair('XOR', 'S'),
      pair('AND', 'C'),
    ],
  };
}

function fullAdderNet(): Netlist {
  return {
    nodes: [
      { id: 'A', kind: 'IN', x: 30, y: 60, label: 'A' },
      { id: 'B', kind: 'IN', x: 30, y: 150, label: 'B' },
      { id: 'Cin', kind: 'IN', x: 30, y: 260, label: 'Cin' },
      { id: 'X1', kind: 'XOR', x: 200, y: 80, label: 'XOR' },
      { id: 'X2', kind: 'XOR', x: 380, y: 80, label: 'XOR' },
      { id: 'A1', kind: 'AND', x: 200, y: 200, label: 'AND' },
      { id: 'A2', kind: 'AND', x: 380, y: 200, label: 'AND' },
      { id: 'O1', kind: 'OR', x: 540, y: 200, label: 'OR' },
      { id: 'S', kind: 'OUT', x: 560, y: 80, label: 'S' },
      { id: 'Cout', kind: 'OUT', x: 700, y: 200, label: 'Cout' },
    ],
    wires: [
      pair('A', 'X1', 'out', 'in1'),
      pair('B', 'X1', 'out', 'in2'),
      pair('X1', 'X2', 'out', 'in1'),
      pair('Cin', 'X2', 'out', 'in2'),
      pair('A', 'A1', 'out', 'in1'),
      pair('B', 'A1', 'out', 'in2'),
      pair('X1', 'A2', 'out', 'in1'),
      pair('Cin', 'A2', 'out', 'in2'),
      pair('A1', 'O1', 'out', 'in1'),
      pair('A2', 'O1', 'out', 'in2'),
      pair('X2', 'S'),
      pair('O1', 'Cout'),
    ],
  };
}

export const MSI_LIBRARY: IcDefinition[] = [
  {
    id: 'half-adder',
    name: 'Sumador medio',
    part: 'HA',
    category: 'Aritméticos',
    description: 'Suma dos bits y genera suma y acarreo. S = A ⊕ B, C = A·B.',
    inputs: pins(['A', 'B'], 'left'),
    outputs: pins(['S', 'C'], 'right'),
    evaluate: (i) => ({ S: xor(i['A'], i['B']), C: and(i['A'], i['B']) }),
    netlist: halfAdderNet(),
  },
  {
    id: 'full-adder',
    name: 'Sumador completo',
    part: 'FA',
    category: 'Aritméticos',
    description: 'Suma A, B y Cin. S = A ⊕ B ⊕ Cin, Cout = mayoritario.',
    inputs: pins(['A', 'B', 'Cin'], 'left'),
    outputs: pins(['S', 'Cout'], 'right'),
    evaluate: (i) => {
      const s = xor(i['A'], i['B'], i['Cin']);
      const cout = or(and(i['A'], i['B']), and(i['Cin'], xor(i['A'], i['B'])));
      return { S: s, Cout: cout };
    },
    netlist: fullAdderNet(),
  },
  {
    id: 'adder-4',
    name: 'Sumador de 4 bits',
    part: '7483',
    category: 'Aritméticos',
    description: 'Sumador paralelo TTL 7483 con acarreo en cascada (ripple-carry).',
    inputs: pins(['A3', 'A2', 'A1', 'A0', 'B3', 'B2', 'B1', 'B0', 'C0'], 'left'),
    outputs: pins(['S3', 'S2', 'S1', 'S0', 'C4'], 'right'),
    evaluate: (i) => {
      const a = bitsToInt([i['A3'], i['A2'], i['A1'], i['A0']]);
      const b = bitsToInt([i['B3'], i['B2'], i['B1'], i['B0']]);
      const sum = a + b + i['C0'];
      const bits = intToBits(sum & 0xf, 4);
      return { S3: bits[0], S2: bits[1], S1: bits[2], S0: bits[3], C4: bit((sum >> 4) & 1) };
    },
    netlist: fullAdderNet(),
  },
  {
    id: 'half-sub',
    name: 'Restador medio',
    part: 'HS',
    category: 'Aritméticos',
    description: 'D = A ⊕ B, Bout = A\'·B.',
    inputs: pins(['A', 'B'], 'left'),
    outputs: pins(['D', 'Bout'], 'right'),
    evaluate: (i) => ({ D: xor(i['A'], i['B']), Bout: and(not(i['A']), i['B']) }),
    netlist: {
      nodes: [
        { id: 'A', kind: 'IN', x: 40, y: 70, label: 'A' },
        { id: 'B', kind: 'IN', x: 40, y: 210, label: 'B' },
        { id: 'N', kind: 'NOT', x: 200, y: 70, label: 'NOT' },
        { id: 'X', kind: 'XOR', x: 200, y: 160, label: 'XOR' },
        { id: 'A1', kind: 'AND', x: 360, y: 210, label: 'AND' },
        { id: 'D', kind: 'OUT', x: 520, y: 160, label: 'D' },
        { id: 'Bo', kind: 'OUT', x: 520, y: 210, label: 'Bout' },
      ],
      wires: [
        pair('A', 'X', 'out', 'in1'),
        pair('B', 'X', 'out', 'in2'),
        pair('A', 'N'),
        pair('N', 'A1', 'out', 'in1'),
        pair('B', 'A1', 'out', 'in2'),
        pair('X', 'D'),
        pair('A1', 'Bo'),
      ],
    },
  },
  {
    id: 'full-sub',
    name: 'Restador completo',
    part: 'FS',
    category: 'Aritméticos',
    description: 'Resta A − B − Bin con diferencia y préstamo.',
    inputs: pins(['A', 'B', 'Bin'], 'left'),
    outputs: pins(['D', 'Bout'], 'right'),
    evaluate: (i) => {
      const d = xor(i['A'], i['B'], i['Bin']);
      const bout = or(and(not(i['A']), i['B']), and(not(xor(i['A'], i['B'])), i['Bin']));
      return { D: d, Bout: bout };
    },
  },
  {
    id: 'cmp-4',
    name: 'Comparador de magnitud',
    part: '7485',
    category: 'Aritméticos',
    description: 'Compara A[3:0] y B[3:0]. Salidas A>B, A=B y A<B (TTL 7485).',
    inputs: pins(['A3', 'A2', 'A1', 'A0', 'B3', 'B2', 'B1', 'B0'], 'left'),
    outputs: pins(['AGT', 'AEQ', 'ALT'], 'right'),
    evaluate: (i) => {
      const a = bitsToInt([i['A3'], i['A2'], i['A1'], i['A0']]);
      const b = bitsToInt([i['B3'], i['B2'], i['B1'], i['B0']]);
      return { AGT: bit(a > b), AEQ: bit(a === b), ALT: bit(a < b) };
    },
  },
  {
    id: 'bin-gray',
    name: 'Binario a Gray',
    category: 'Códigos',
    description: 'G = B ⊕ (B >> 1). Conversor de código binario a Gray de 4 bits.',
    inputs: pins(['B3', 'B2', 'B1', 'B0'], 'left'),
    outputs: pins(['G3', 'G2', 'G1', 'G0'], 'right'),
    evaluate: (i) => ({
      G3: i['B3'],
      G2: xor(i['B3'], i['B2']),
      G1: xor(i['B2'], i['B1']),
      G0: xor(i['B1'], i['B0']),
    }),
    netlist: {
      nodes: [
        { id: 'B3', kind: 'IN', x: 40, y: 40, label: 'B3' },
        { id: 'B2', kind: 'IN', x: 40, y: 120, label: 'B2' },
        { id: 'B1', kind: 'IN', x: 40, y: 200, label: 'B1' },
        { id: 'B0', kind: 'IN', x: 40, y: 280, label: 'B0' },
        { id: 'X2', kind: 'XOR', x: 240, y: 100, label: 'XOR' },
        { id: 'X1', kind: 'XOR', x: 240, y: 180, label: 'XOR' },
        { id: 'X0', kind: 'XOR', x: 240, y: 260, label: 'XOR' },
        { id: 'G3', kind: 'OUT', x: 460, y: 40, label: 'G3' },
        { id: 'G2', kind: 'OUT', x: 460, y: 100, label: 'G2' },
        { id: 'G1', kind: 'OUT', x: 460, y: 180, label: 'G1' },
        { id: 'G0', kind: 'OUT', x: 460, y: 260, label: 'G0' },
      ],
      wires: [
        pair('B3', 'G3'),
        pair('B3', 'X2', 'out', 'in1'),
        pair('B2', 'X2', 'out', 'in2'),
        pair('B2', 'X1', 'out', 'in1'),
        pair('B1', 'X1', 'out', 'in2'),
        pair('B1', 'X0', 'out', 'in1'),
        pair('B0', 'X0', 'out', 'in2'),
        pair('X2', 'G2'),
        pair('X1', 'G1'),
        pair('X0', 'G0'),
      ],
    },
  },
  {
    id: 'gray-bin',
    name: 'Gray a binario',
    category: 'Códigos',
    description: 'Reconstrucción binaria por XOR en cascada desde el MSB.',
    inputs: pins(['G3', 'G2', 'G1', 'G0'], 'left'),
    outputs: pins(['B3', 'B2', 'B1', 'B0'], 'right'),
    evaluate: (i) => {
      const b3 = i['G3'];
      const b2 = xor(b3, i['G2']);
      const b1 = xor(b2, i['G1']);
      const b0 = xor(b1, i['G0']);
      return { B3: b3, B2: b2, B1: b1, B0: b0 };
    },
  },
  {
    id: 'bcd-ex3',
    name: 'BCD a Excess-3',
    category: 'Códigos',
    description: 'XS3 = BCD + 3. Conversor clásico de código BCD.',
    inputs: pins(['D', 'C', 'B', 'A'], 'left'),
    outputs: pins(['W', 'X', 'Y', 'Z'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['D'], i['C'], i['B'], i['A']]);
      const bits = intToBits((n + 3) & 0xf, 4);
      return { W: bits[0], X: bits[1], Y: bits[2], Z: bits[3] };
    },
  },
  {
    id: 'enc-8-3',
    name: 'Codificador 8 a 3',
    part: '74148',
    category: 'Codificadores',
    description: 'Codificador de prioridad 8:3. Gana la entrada de mayor índice en 1.',
    inputs: pins(['I7', 'I6', 'I5', 'I4', 'I3', 'I2', 'I1', 'I0', 'EI'], 'left'),
    outputs: pins(['A2', 'A1', 'A0', 'GS', 'EO'], 'right'),
    evaluate: (i) => {
      if (!i['EI']) return { A2: 0, A1: 0, A0: 0, GS: 0, EO: 0 };
      const lines = [i['I0'], i['I1'], i['I2'], i['I3'], i['I4'], i['I5'], i['I6'], i['I7']];
      let idx = -1;
      for (let n = 7; n >= 0; n--) if (lines[n]) { idx = n; break; }
      if (idx < 0) return { A2: 0, A1: 0, A0: 0, GS: 0, EO: 1 };
      const bits = intToBits(idx, 3);
      return { A2: bits[0], A1: bits[1], A0: bits[2], GS: 1, EO: 0 };
    },
  },
  {
    id: 'enc-10-4',
    name: 'Codificador decimal de prioridad',
    part: '74147',
    category: 'Codificadores',
    description: 'Codificador de prioridad 10 a 4 (BCD) estilo 74147.',
    inputs: pins(['I9', 'I8', 'I7', 'I6', 'I5', 'I4', 'I3', 'I2', 'I1'], 'left'),
    outputs: pins(['A3', 'A2', 'A1', 'A0'], 'right'),
    evaluate: (i) => {
      let idx = 0;
      for (let n = 9; n >= 1; n--) if (i[`I${n}`]) { idx = n; break; }
      const bits = intToBits(idx, 4);
      return { A3: bits[0], A2: bits[1], A1: bits[2], A0: bits[3] };
    },
  },
  {
    id: 'dec-2-4',
    name: 'Decodificador 2 a 4',
    part: '74139',
    category: 'Decodificadores',
    description: 'Una de cuatro salidas activas según A1 A0, con habilitación.',
    inputs: pins(['A1', 'A0', 'E'], 'left'),
    outputs: pins(['Y0', 'Y1', 'Y2', 'Y3'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['A1'], i['A0']]);
      const out: Record<string, Bit> = { Y0: 0, Y1: 0, Y2: 0, Y3: 0 };
      if (i['E']) out[`Y${n}`] = 1;
      return out;
    },
    netlist: {
      nodes: [
        { id: 'A1', kind: 'IN', x: 30, y: 40, label: 'A1' },
        { id: 'A0', kind: 'IN', x: 30, y: 140, label: 'A0' },
        { id: 'E', kind: 'IN', x: 30, y: 240, label: 'E' },
        { id: 'N1', kind: 'NOT', x: 180, y: 40, label: "A1'" },
        { id: 'N0', kind: 'NOT', x: 180, y: 140, label: "A0'" },
        { id: 'G0', kind: 'AND', x: 360, y: 40, label: 'AND', inputs: 3 },
        { id: 'G1', kind: 'AND', x: 360, y: 120, label: 'AND', inputs: 3 },
        { id: 'G2', kind: 'AND', x: 360, y: 200, label: 'AND', inputs: 3 },
        { id: 'G3', kind: 'AND', x: 360, y: 280, label: 'AND', inputs: 3 },
        { id: 'Y0', kind: 'OUT', x: 560, y: 40, label: 'Y0' },
        { id: 'Y1', kind: 'OUT', x: 560, y: 120, label: 'Y1' },
        { id: 'Y2', kind: 'OUT', x: 560, y: 200, label: 'Y2' },
        { id: 'Y3', kind: 'OUT', x: 560, y: 280, label: 'Y3' },
      ],
      wires: [
        pair('A1', 'N1'),
        pair('A0', 'N0'),
        pair('N1', 'G0', 'out', 'in1'),
        pair('N0', 'G0', 'out', 'in2'),
        pair('E', 'G0', 'out', 'in3'),
        pair('N1', 'G1', 'out', 'in1'),
        pair('A0', 'G1', 'out', 'in2'),
        pair('E', 'G1', 'out', 'in3'),
        pair('A1', 'G2', 'out', 'in1'),
        pair('N0', 'G2', 'out', 'in2'),
        pair('E', 'G2', 'out', 'in3'),
        pair('A1', 'G3', 'out', 'in1'),
        pair('A0', 'G3', 'out', 'in2'),
        pair('E', 'G3', 'out', 'in3'),
        pair('G0', 'Y0'),
        pair('G1', 'Y1'),
        pair('G2', 'Y2'),
        pair('G3', 'Y3'),
      ],
    },
  },
  {
    id: 'dec-3-8',
    name: 'Decodificador 3 a 8',
    part: '74138',
    category: 'Decodificadores',
    description: 'Decodificador/demultiplexor TTL 74138. Una de ocho salidas.',
    inputs: pins(['A2', 'A1', 'A0', 'E'], 'left'),
    outputs: pins(['Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['A2'], i['A1'], i['A0']]);
      const out: Record<string, Bit> = {};
      for (let k = 0; k < 8; k++) out[`Y${k}`] = i['E'] && k === n ? 1 : 0;
      return out;
    },
  },
  {
    id: 'dec-4-16',
    name: 'Decodificador 4 a 16',
    part: '74154',
    category: 'Decodificadores',
    description: 'Decodificador 4:16 (74154). Dirección A3..A0 y enable.',
    inputs: pins(['A3', 'A2', 'A1', 'A0', 'E'], 'left'),
    outputs: pins([...Array.from({ length: 16 }, (_, k) => `Y${k}`)], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['A3'], i['A2'], i['A1'], i['A0']]);
      const out: Record<string, Bit> = {};
      for (let k = 0; k < 16; k++) out[`Y${k}`] = i['E'] && k === n ? 1 : 0;
      return out;
    },
  },
  {
    id: 'bcd-7seg',
    name: 'BCD a 7 segmentos',
    part: '7447',
    category: 'Decodificadores',
    description: 'Decodificador 7447/7448. Enciende segmentos a,b,c,d,e,f,g.',
    inputs: pins(['D', 'C', 'B', 'A'], 'left'),
    outputs: pins(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['D'], i['C'], i['B'], i['A']]);
      const patterns: Record<number, string> = {
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
      const p = patterns[n] ?? '0000001';
      const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const out: Record<string, Bit> = {};
      names.forEach((name, idx) => (out[name] = bit(p[idx])));
      return out;
    },
  },
  {
    id: 'mux-2',
    name: 'Multiplexor 2:1',
    part: '74157',
    category: 'Multiplexores',
    description: 'Y = S\'·D0 + S·D1. Bloque básico de selección.',
    inputs: pins(['D0', 'D1', 'S', 'E'], 'left'),
    outputs: pins(['Y'], 'right'),
    evaluate: (i) => ({ Y: i['E'] ? (i['S'] ? i['D1'] : i['D0']) : 0 }),
    netlist: {
      nodes: [
        { id: 'D0', kind: 'IN', x: 30, y: 50, label: 'D0' },
        { id: 'D1', kind: 'IN', x: 30, y: 150, label: 'D1' },
        { id: 'S', kind: 'IN', x: 30, y: 250, label: 'S' },
        { id: 'E', kind: 'IN', x: 30, y: 330, label: 'E' },
        { id: 'NS', kind: 'NOT', x: 180, y: 250, label: "S'" },
        { id: 'A0', kind: 'AND', x: 340, y: 50, label: 'AND', inputs: 3 },
        { id: 'A1', kind: 'AND', x: 340, y: 160, label: 'AND', inputs: 3 },
        { id: 'O', kind: 'OR', x: 520, y: 110, label: 'OR' },
        { id: 'Y', kind: 'OUT', x: 680, y: 110, label: 'Y' },
      ],
      wires: [
        pair('S', 'NS'),
        pair('D0', 'A0', 'out', 'in1'),
        pair('NS', 'A0', 'out', 'in2'),
        pair('E', 'A0', 'out', 'in3'),
        pair('D1', 'A1', 'out', 'in1'),
        pair('S', 'A1', 'out', 'in2'),
        pair('E', 'A1', 'out', 'in3'),
        pair('A0', 'O', 'out', 'in1'),
        pair('A1', 'O', 'out', 'in2'),
        pair('O', 'Y'),
      ],
    },
  },
  {
    id: 'mux-4',
    name: 'Multiplexor 4:1',
    part: '74153',
    category: 'Multiplexores',
    description: 'Selecciona una de cuatro entradas de datos con S1 S0.',
    inputs: pins(['D0', 'D1', 'D2', 'D3', 'S1', 'S0', 'E'], 'left'),
    outputs: pins(['Y'], 'right'),
    evaluate: (i) => {
      if (!i['E']) return { Y: 0 };
      const n = bitsToInt([i['S1'], i['S0']]);
      return { Y: i[`D${n}`] ?? 0 };
    },
  },
  {
    id: 'mux-8',
    name: 'Multiplexor 8:1',
    part: '74151',
    category: 'Multiplexores',
    description: 'MUX TTL 74151 de 8 entradas de datos y 3 de selección.',
    inputs: pins(['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'S2', 'S1', 'S0', 'E'], 'left'),
    outputs: pins(['Y'], 'right'),
    evaluate: (i) => {
      if (!i['E']) return { Y: 0 };
      const n = bitsToInt([i['S2'], i['S1'], i['S0']]);
      return { Y: i[`D${n}`] ?? 0 };
    },
  },
  {
    id: 'mux-16',
    name: 'Multiplexor 16:1',
    part: '74150',
    category: 'Multiplexores',
    description: 'MUX 16:1 (74150) con cuatro bits de selección.',
    inputs: pins(
      [...Array.from({ length: 16 }, (_, k) => `D${k}`), 'S3', 'S2', 'S1', 'S0', 'E'],
      'left',
    ),
    outputs: pins(['Y'], 'right'),
    evaluate: (i) => {
      if (!i['E']) return { Y: 0 };
      const n = bitsToInt([i['S3'], i['S2'], i['S1'], i['S0']]);
      return { Y: i[`D${n}`] ?? 0 };
    },
  },
  {
    id: 'demux-1-4',
    name: 'Demultiplexor 1:4',
    category: 'Multiplexores',
    description: 'Enruta D hacia una de cuatro salidas según S1 S0.',
    inputs: pins(['D', 'S1', 'S0', 'E'], 'left'),
    outputs: pins(['Y0', 'Y1', 'Y2', 'Y3'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['S1'], i['S0']]);
      const out: Record<string, Bit> = { Y0: 0, Y1: 0, Y2: 0, Y3: 0 };
      if (i['E']) out[`Y${n}`] = i['D'];
      return out;
    },
  },
  {
    id: 'demux-1-8',
    name: 'Demultiplexor 1:8',
    part: '74138',
    category: 'Multiplexores',
    description: 'El 74138 también opera como demux 1:8 cuando D alimenta el enable.',
    inputs: pins(['D', 'S2', 'S1', 'S0'], 'left'),
    outputs: pins(['Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'], 'right'),
    evaluate: (i) => {
      const n = bitsToInt([i['S2'], i['S1'], i['S0']]);
      const out: Record<string, Bit> = {};
      for (let k = 0; k < 8; k++) out[`Y${k}`] = k === n ? i['D'] : 0;
      return out;
    },
  },
  {
    id: 'parity-9',
    name: 'Generador/verificador de paridad',
    part: '74180',
    category: 'Paridad',
    description: 'XOR en árbol de 8 bits de datos más bit de paridad (74180).',
    inputs: pins(['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0', 'PE'], 'left'),
    outputs: pins(['EVEN', 'ODD'], 'right'),
    evaluate: (i) => {
      const p = xor(i['D7'], i['D6'], i['D5'], i['D4'], i['D3'], i['D2'], i['D1'], i['D0'], i['PE']);
      return { ODD: p, EVEN: not(p) };
    },
    netlist: {
      nodes: [
        { id: 'D0', kind: 'IN', x: 30, y: 40, label: 'D0' },
        { id: 'D1', kind: 'IN', x: 30, y: 110, label: 'D1' },
        { id: 'D2', kind: 'IN', x: 30, y: 180, label: 'D2' },
        { id: 'D3', kind: 'IN', x: 30, y: 250, label: 'D3' },
        { id: 'X0', kind: 'XOR', x: 200, y: 70, label: 'XOR' },
        { id: 'X1', kind: 'XOR', x: 200, y: 210, label: 'XOR' },
        { id: 'X2', kind: 'XOR', x: 380, y: 140, label: 'XOR' },
        { id: 'ODD', kind: 'OUT', x: 560, y: 110, label: 'ODD' },
        { id: 'EVEN', kind: 'OUT', x: 560, y: 200, label: 'EVEN' },
        { id: 'N', kind: 'NOT', x: 380, y: 220, label: 'NOT' },
      ],
      wires: [
        pair('D0', 'X0', 'out', 'in1'),
        pair('D1', 'X0', 'out', 'in2'),
        pair('D2', 'X1', 'out', 'in1'),
        pair('D3', 'X1', 'out', 'in2'),
        pair('X0', 'X2', 'out', 'in1'),
        pair('X1', 'X2', 'out', 'in2'),
        pair('X2', 'ODD'),
        pair('X2', 'N'),
        pair('N', 'EVEN'),
      ],
    },
  },
  {
    id: 'alu-1',
    name: 'ALU de 1 bit',
    part: '74181 (slice)',
    category: 'ALU',
    description: 'Rebanada de ALU: AND, OR, XOR, suma y NOT seleccionados por S1 S0.',
    inputs: pins(['A', 'B', 'Cin', 'S1', 'S0'], 'left'),
    outputs: pins(['F', 'Cout'], 'right'),
    evaluate: (i) => {
      const sel = bitsToInt([i['S1'], i['S0']]);
      if (sel === 0) return { F: and(i['A'], i['B']), Cout: 0 };
      if (sel === 1) return { F: or(i['A'], i['B']), Cout: 0 };
      if (sel === 2) return { F: xor(i['A'], i['B']), Cout: 0 };
      const s = xor(i['A'], i['B'], i['Cin']);
      const cout = or(and(i['A'], i['B']), and(i['Cin'], xor(i['A'], i['B'])));
      return { F: s, Cout: cout };
    },
  },
  {
    id: 'alu-4',
    name: 'ALU de 4 bits',
    part: '74181',
    category: 'ALU',
    description: 'ALU 74181 simplificada: AND, OR, XOR y suma de palabras de 4 bits.',
    inputs: pins(['A3', 'A2', 'A1', 'A0', 'B3', 'B2', 'B1', 'B0', 'Cin', 'S1', 'S0'], 'left'),
    outputs: pins(['F3', 'F2', 'F1', 'F0', 'Cout'], 'right'),
    evaluate: (i) => {
      const sel = bitsToInt([i['S1'], i['S0']]);
      const a = [i['A3'], i['A2'], i['A1'], i['A0']];
      const b = [i['B3'], i['B2'], i['B1'], i['B0']];
      const f: Bit[] = [0, 0, 0, 0];
      let cout: Bit = 0;
      if (sel === 3) {
        const sum = bitsToInt(a) + bitsToInt(b) + i['Cin'];
        const bits = intToBits(sum & 0xf, 4);
        f[0] = bits[0];
        f[1] = bits[1];
        f[2] = bits[2];
        f[3] = bits[3];
        cout = bit((sum >> 4) & 1);
      } else {
        for (let n = 0; n < 4; n++) {
          if (sel === 0) f[n] = and(a[n], b[n]);
          else if (sel === 1) f[n] = or(a[n], b[n]);
          else f[n] = xor(a[n], b[n]);
        }
      }
      return { F3: f[0], F2: f[1], F1: f[2], F0: f[3], Cout: cout };
    },
  },
  {
    id: 'mult-2',
    name: 'Multiplicador 2x2',
    category: 'Aritméticos',
    description: 'Producto combinacional de dos números de 2 bits (P3..P0).',
    inputs: pins(['A1', 'A0', 'B1', 'B0'], 'left'),
    outputs: pins(['P3', 'P2', 'P1', 'P0'], 'right'),
    evaluate: (i) => {
      const p = bitsToInt([i['A1'], i['A0']]) * bitsToInt([i['B1'], i['B0']]);
      const bits = intToBits(p, 4);
      return { P3: bits[0], P2: bits[1], P1: bits[2], P0: bits[3] };
    },
    netlist: {
      nodes: [
        { id: 'A0', kind: 'IN', x: 30, y: 40, label: 'A0' },
        { id: 'A1', kind: 'IN', x: 30, y: 120, label: 'A1' },
        { id: 'B0', kind: 'IN', x: 30, y: 200, label: 'B0' },
        { id: 'B1', kind: 'IN', x: 30, y: 280, label: 'B1' },
        { id: 'P00', kind: 'AND', x: 220, y: 40, label: 'A0·B0' },
        { id: 'P01', kind: 'AND', x: 220, y: 120, label: 'A0·B1' },
        { id: 'P10', kind: 'AND', x: 220, y: 200, label: 'A1·B0' },
        { id: 'P11', kind: 'AND', x: 220, y: 280, label: 'A1·B1' },
        { id: 'HA1', kind: 'XOR', x: 420, y: 140, label: 'XOR' },
        { id: 'HA2', kind: 'AND', x: 420, y: 220, label: 'AND' },
        { id: 'P0', kind: 'OUT', x: 620, y: 40, label: 'P0' },
        { id: 'P1', kind: 'OUT', x: 620, y: 140, label: 'P1' },
        { id: 'P2', kind: 'OUT', x: 620, y: 220, label: 'P2' },
        { id: 'P3', kind: 'OUT', x: 620, y: 300, label: 'P3' },
      ],
      wires: [
        pair('A0', 'P00', 'out', 'in1'),
        pair('B0', 'P00', 'out', 'in2'),
        pair('A0', 'P01', 'out', 'in1'),
        pair('B1', 'P01', 'out', 'in2'),
        pair('A1', 'P10', 'out', 'in1'),
        pair('B0', 'P10', 'out', 'in2'),
        pair('A1', 'P11', 'out', 'in1'),
        pair('B1', 'P11', 'out', 'in2'),
        pair('P00', 'P0'),
        pair('P01', 'HA1', 'out', 'in1'),
        pair('P10', 'HA1', 'out', 'in2'),
        pair('P01', 'HA2', 'out', 'in1'),
        pair('P10', 'HA2', 'out', 'in2'),
        pair('HA1', 'P1'),
        pair('HA2', 'P2'),
        pair('P11', 'P3'),
      ],
    },
  },
];

export const MSI_CATEGORIES = [...new Set(MSI_LIBRARY.map((ic) => ic.category))];

export function findIc(id: string): IcDefinition {
  return MSI_LIBRARY.find((ic) => ic.id === id) ?? MSI_LIBRARY[0];
}

