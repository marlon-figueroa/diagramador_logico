export type Bit = 0 | 1;
export type CellValue = 0 | 1 | 'X';

export type GateKind =
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUF'
  | 'IN'
  | 'OUT'
  | 'VCC'
  | 'GND'
  | 'CLK'
  | 'IC'
  | 'FF';

export interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  accent: string;
  topics: string[];
}

export interface PaletteItem {
  kind: GateKind;
  label: string;
  inputs?: number;
  icon: string;
}

export interface NetNode {
  id: string;
  kind: GateKind;
  x: number;
  y: number;
  label?: string;
  inputs?: number;
  bits?: Record<string, Bit>;
}

export interface NetWire {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
}

export interface Netlist {
  nodes: NetNode[];
  wires: NetWire[];
}

export interface PinDef {
  id: string;
  label: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  polarity?: 'high' | 'low';
}

export interface TruthRow {
  inputs: Record<string, Bit | string>;
  outputs: Record<string, Bit | string>;
  note?: string;
}

export interface IcDefinition {
  id: string;
  name: string;
  part?: string;
  category: string;
  description: string;
  inputs: PinDef[];
  outputs: PinDef[];
  evaluate: (inputs: Record<string, Bit>) => Record<string, Bit>;
  netlist?: Netlist;
  truth?: TruthRow[];
}

export interface FlipFlopForm {
  id: string;
  name: string;
  family: 'latch' | 'flipflop';
  trigger: 'level' | 'rising' | 'falling' | 'async' | 'master-slave';
  description: string;
  inputs: string[];
  nextQ: (state: Bit, inputs: Record<string, Bit>, edge: boolean) => Bit | 'invalid';
  characteristic: TruthRow[];
  excitation: TruthRow[];
  equation: string;
  netlist: Netlist;
}
