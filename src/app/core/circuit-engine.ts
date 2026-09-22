import { dia, shapes } from '@joint/core';
import type { Bit, GateKind, Netlist } from './models';
import { evalGate } from './logic';

const NS = { ...shapes };

const PATHS: Record<string, string> = {
  AND: 'M 8 4 H 42 C 72 4 86 16 86 30 C 86 44 72 56 42 56 H 8 Z',
  OR: 'M 6 4 C 26 4 48 10 86 30 C 48 50 26 56 6 56 C 20 40 20 20 6 4 Z',
  XOR: 'M 0 8 C 14 20 14 40 0 52 M 8 4 C 28 4 50 10 88 30 C 50 50 28 56 8 56 C 22 40 22 20 8 4 Z',
  TRI: 'M 10 6 L 82 30 L 10 54 Z',
  FF: 'M 8 6 H 82 V 54 H 8 Z',
  IC: 'M 10 4 H 86 V 56 H 10 Z',
};

const BUBBLE = new Set<GateKind>(['NAND', 'NOR', 'XNOR', 'NOT']);

export interface EngineHandlers {
  onChange?: () => void;
  onSelect?: (id: string | null) => void;
}

export class CircuitEngine {
  readonly graph: dia.Graph;
  readonly paper: dia.Paper;
  private readonly host: HTMLElement;
  private readonly resize: ResizeObserver;
  private scale = 1;
  private panning = false;
  private panX = 0;
  private panY = 0;
  private handlers: EngineHandlers;

  constructor(host: HTMLElement, handlers: EngineHandlers = {}) {
    this.host = host;
    this.handlers = handlers;
    this.graph = new dia.Graph({}, { cellNamespace: NS });
    this.paper = new dia.Paper({
      el: host,
      model: this.graph,
      width: host.clientWidth || 800,
      height: host.clientHeight || 520,
      gridSize: 10,
      drawGrid: { name: 'dot', args: { color: canvasTheme().grid } },
      background: { color: canvasTheme().background },
      cellViewNamespace: NS,
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      linkPinning: false,
      snapLinks: { radius: 24 },
      markAvailable: true,
      defaultConnector: { name: 'rounded' },
      defaultRouter: { name: 'rightAngle', args: { margin: 16 } },
      defaultLink: () => this.createWire(),
      defaultConnectionPoint: { name: 'boundary' },
      validateConnection: (_sView, sMagnet, tView, tMagnet, _end, linkView) => {
        if (!sMagnet || !tMagnet || !tView) return false;
        if (sMagnet === tMagnet) return false;
        const sourceGroup = sMagnet.getAttribute('port-group');
        const targetGroup = tMagnet.getAttribute('port-group');
        if (sourceGroup === 'out' && targetGroup === 'in') return true;
        if (linkView.model.get('source') && targetGroup === 'in') return true;
        return sourceGroup !== targetGroup;
      },
      highlighting: {
        default: {
          name: 'stroke',
          options: { padding: 4, attrs: { stroke: '#5eead4', 'stroke-width': 2 } },
        },
      },
    });

    this.paper.on('element:pointerclick', (view) => {
      const kind = view.model.prop('logic/kind') as GateKind;
      if (kind === 'IN' || kind === 'CLK') {
        const current = (view.model.prop('logic/value') as Bit) ?? 0;
        view.model.prop('logic/value', current ? 0 : 1);
        this.simulate();
      }
      this.handlers.onSelect?.(view.model.id as string);
    });
    this.paper.on('blank:pointerclick', () => this.handlers.onSelect?.(null));
    this.paper.on('blank:pointerdown', (evt) => {
      const e = evt as unknown as PointerEvent;
      this.panning = true;
      this.panX = e.clientX;
      this.panY = e.clientY;
    });
    this.paper.on('blank:pointermove', (evt) => {
      if (!this.panning) return;
      const e = evt as unknown as PointerEvent;
      const tx = e.clientX - this.panX;
      const ty = e.clientY - this.panY;
      this.panX = e.clientX;
      this.panY = e.clientY;
      const t = this.paper.translate();
      this.paper.translate(t.tx + tx, t.ty + ty);
    });
    this.paper.on('blank:pointerup', () => (this.panning = false));
    host.addEventListener('wheel', this.onWheel, { passive: false });

    this.graph.on('change:source change:target add remove', () => this.simulate());
    this.resize = new ResizeObserver(() => this.fitHost());
    this.resize.observe(host);
    document.documentElement.addEventListener('lab-theme', this.onTheme);
    this.fitHost();
    this.applyTheme();
  }

  destroy(): void {
    this.host.removeEventListener('wheel', this.onWheel);
    document.documentElement.removeEventListener('lab-theme', this.onTheme);
    this.resize.disconnect();
    this.paper.remove();
    this.graph.clear();
  }

  clear(): void {
    this.graph.clear();
    this.handlers.onChange?.();
  }

  zoom(delta: number): void {
    this.scale = Math.min(2.2, Math.max(0.35, this.scale + delta));
    this.paper.scale(this.scale, this.scale);
  }

  fit(): void {
    this.paper.scaleContentToFit({ padding: 40, maxScale: 1.4 });
    this.scale = this.paper.scale().sx;
  }

  addGate(kind: GateKind, x = 180, y = 140, label?: string, inputs?: number): dia.Element {
    const count = inputs ?? defaultInputs(kind);
    const el = new shapes.standard.Path();
    const height =
      kind === 'NOT' || kind === 'BUF' ? 56 : kind === 'IC' || kind === 'FF' ? 64 : Math.max(64, 28 + count * 18);
    el.resize(kind === 'IC' || kind === 'FF' ? 110 : 96, height);
    el.position(x, y);
    el.attr({
      body: {
        d: pathFor(kind),
        fill: fillFor(kind),
        stroke: strokeFor(kind),
        strokeWidth: 2,
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.35))',
      },
      label: {
        text: label ?? kind,
        fill: labelColor(),
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        x: kind === 'XOR' ? 48 : 46,
        y: 32,
        pointerEvents: 'none',
      },
    });
    if (BUBBLE.has(kind)) {
      el.attr('label/x', 40);
    }
    el.set('ports', portGroups(kind, count));
    el.prop('logic/kind', kind);
    el.prop('logic/value', kind === 'VCC' ? 1 : 0);
    el.prop('logic/label', label ?? kind);
    this.graph.addCell(el);
    this.simulate();
    return el;
  }

  loadNetlist(net: Netlist): void {
    this.clear();
    const map = new Map<string, dia.Element>();
    for (const node of net.nodes) {
      map.set(node.id, this.addGate(node.kind, node.x, node.y, node.label, node.inputs));
    }
    for (const wire of net.wires) {
      const source = map.get(wire.from);
      const target = map.get(wire.to);
      if (!source || !target) continue;
      const link = this.createWire();
      link.source({ id: source.id, port: wire.fromPort ?? outPort(source) });
      link.target({ id: target.id, port: wire.toPort ?? firstFreeIn(target, this.graph) });
      this.graph.addCell(link);
    }
    this.paper.once('render:done', () => this.fit());
    queueMicrotask(() => this.fit());
  }

  simulate(): Record<string, Bit> {
    const values = new Map<string, Bit>();
    const elements = this.graph.getElements();
    for (const el of elements) {
      const kind = el.prop('logic/kind') as GateKind;
      if (kind === 'IN' || kind === 'VCC' || kind === 'GND' || kind === 'CLK') {
        const v = kind === 'VCC' ? 1 : kind === 'GND' ? 0 : ((el.prop('logic/value') as Bit) ?? 0);
        values.set(el.id as string, v);
        el.prop('logic/value', v);
      }
    }

    for (let pass = 0; pass < 8; pass++) {
      for (const el of elements) {
        const kind = el.prop('logic/kind') as GateKind;
        if (kind === 'IN' || kind === 'VCC' || kind === 'GND' || kind === 'CLK') continue;
        const ins = incomingBits(this.graph, el, values);
        const next = kind === 'OUT' || kind === 'IC' || kind === 'FF' ? (ins[0] ?? 0) : evalGate(kind, ins);
        values.set(el.id as string, next);
        el.prop('logic/value', next);
      }
    }

    for (const el of elements) {
      const v = values.get(el.id as string) ?? 0;
      paintElement(el, v);
    }
    for (const link of this.graph.getLinks()) {
      const src = link.getSourceCell();
      const v = src ? (values.get(src.id as string) ?? 0) : 0;
      paintLink(link, v);
    }
    this.handlers.onChange?.();
    const named: Record<string, Bit> = {};
    for (const el of elements) {
      const label = (el.prop('logic/label') as string) ?? '';
      named[label] = values.get(el.id as string) ?? 0;
    }
    return named;
  }

  snapshot(): { labels: Record<string, Bit> } {
    const labels: Record<string, Bit> = {};
    for (const el of this.graph.getElements()) {
      labels[(el.prop('logic/label') as string) ?? (el.id as string)] = (el.prop('logic/value') as Bit) ?? 0;
    }
    return { labels };
  }

  private createWire(): dia.Link {
    const link = new shapes.standard.Link();
    link.router('rightAngle', { margin: 14 });
    link.connector('rounded', { radius: 8 });
    link.attr({
      line: {
        stroke: '#64748b',
        strokeWidth: 2.2,
        targetMarker: { type: 'path', d: 'M 8 -3 0 0 8 3 z', fill: '#64748b' },
      },
    });
    return link;
  }

  applyTheme(): void {
    const theme = canvasTheme();
    this.paper.drawBackground({ color: theme.background });
    this.paper.setGrid({ name: 'dot', args: { color: theme.grid } });
    for (const el of this.graph.getElements()) {
      const kind = el.prop('logic/kind') as GateKind;
      el.attr('body/fill', fillFor(kind));
      el.attr('label/fill', labelColor());
    }
    this.simulate();
  }

  private fitHost(): void {
    this.paper.setDimensions(this.host.clientWidth || 800, this.host.clientHeight || 520);
  }

  private onTheme = (): void => {
    this.applyTheme();
  };

  private onWheel = (ev: Event): void => {
    const e = ev as WheelEvent;
    e.preventDefault();
    this.zoom(e.deltaY > 0 ? -0.08 : 0.08);
  };
}

function defaultInputs(kind: GateKind): number {
  if (kind === 'NOT' || kind === 'BUF' || kind === 'OUT' || kind === 'IN' || kind === 'VCC' || kind === 'GND' || kind === 'CLK') {
    return kind === 'OUT' ? 1 : 0;
  }
  return 2;
}

function pathFor(kind: GateKind): string {
  if (kind === 'AND' || kind === 'NAND') return PATHS['AND'];
  if (kind === 'OR' || kind === 'NOR') return PATHS['OR'];
  if (kind === 'XOR' || kind === 'XNOR') return PATHS['XOR'];
  if (kind === 'NOT' || kind === 'BUF') return PATHS['TRI'];
  if (kind === 'FF') return PATHS['FF'];
  if (kind === 'IC') return PATHS['IC'];
  return 'M 8 10 H 88 V 54 H 8 Z';
}

function isLight(): boolean {
  return document.documentElement.getAttribute('data-bs-theme') === 'light';
}

function canvasTheme(): { background: string; grid: string } {
  return isLight()
    ? { background: '#eef3f8', grid: 'rgba(15,23,42,0.16)' }
    : { background: '#0b1220', grid: 'rgba(148,163,184,0.35)' };
}

function labelColor(): string {
  return isLight() ? '#0f172a' : '#e2e8f0';
}

function fillFor(kind: GateKind): string {
  if (isLight()) {
    if (kind === 'IN' || kind === 'CLK') return '#e0f2fe';
    if (kind === 'OUT') return '#fef3c7';
    if (kind === 'VCC') return '#dcfce7';
    if (kind === 'GND') return '#fee2e2';
    return '#ffffff';
  }
  if (kind === 'IN' || kind === 'CLK') return '#12263a';
  if (kind === 'OUT') return '#1b2433';
  if (kind === 'VCC') return '#14532d';
  if (kind === 'GND') return '#3f1d1d';
  return '#152033';
}

function strokeFor(kind: GateKind): string {
  if (kind === 'IN' || kind === 'CLK') return '#38bdf8';
  if (kind === 'OUT') return '#fbbf24';
  if (kind === 'VCC') return '#4ade80';
  if (kind === 'GND') return '#fb7185';
  return '#5eead4';
}

function portGroups(kind: GateKind, inputs: number): dia.Element.Port[] | object {
  const inCount = kind === 'IN' || kind === 'VCC' || kind === 'GND' || kind === 'CLK' ? 0 : Math.max(inputs, kind === 'OUT' ? 1 : 0);
  const outCount = kind === 'OUT' ? 0 : 1;
  const items: object[] = [];
  for (let i = 0; i < inCount; i++) {
    items.push({ id: `in${i + 1}`, group: 'in' });
  }
  if (outCount) items.push({ id: 'out', group: 'out' });
  return {
    groups: {
      in: {
        position: { name: 'left' },
        attrs: {
          portBody: { magnet: 'passive', r: 5, fill: '#94a3b8', stroke: '#0f172a', strokeWidth: 1.5 },
        },
        markup: [{ tagName: 'circle', selector: 'portBody' }],
      },
      out: {
        position: { name: 'right' },
        attrs: {
          portBody: { magnet: true, r: 5, fill: '#5eead4', stroke: '#042f2e', strokeWidth: 1.5 },
        },
        markup: [{ tagName: 'circle', selector: 'portBody' }],
      },
    },
    items,
  };
}

function incomingBits(graph: dia.Graph, el: dia.Element, values: Map<string, Bit>): Bit[] {
  const ports = (el.getPorts() ?? []).filter((p) => p.group === 'in');
  if (!ports.length) {
    return graph
      .getConnectedLinks(el, { inbound: true })
      .map((link) => {
        const src = link.getSourceCell();
        return src ? (values.get(src.id as string) ?? 0) : 0;
      });
  }
  return ports.map((port) => {
    const link = graph.getConnectedLinks(el, { inbound: true }).find((l) => l.target().port === port.id);
    if (!link) return 0;
    const src = link.getSourceCell();
    return src ? (values.get(src.id as string) ?? 0) : 0;
  });
}

function outPort(el: dia.Element): string | undefined {
  return el.getPorts().find((p) => p.group === 'out')?.id;
}

function firstFreeIn(el: dia.Element, graph: dia.Graph): string | undefined {
  const ins = el.getPorts().filter((p) => p.group === 'in');
  const used = new Set(
    graph
      .getConnectedLinks(el, { inbound: true })
      .map((l) => l.target().port)
      .filter(Boolean),
  );
  return ins.find((p) => !used.has(p.id))?.id ?? ins[0]?.id;
}

function paintElement(el: dia.Element, value: Bit): void {
  const kind = el.prop('logic/kind') as GateKind;
  const on = value === 1;
  if (kind === 'IN' || kind === 'CLK' || kind === 'OUT' || kind === 'VCC' || kind === 'GND') {
    el.attr('body/stroke', on ? '#4ade80' : strokeFor(kind));
    el.attr('label/text', `${el.prop('logic/label')} = ${value}`);
  } else {
    el.attr('body/stroke', on ? '#4ade80' : '#5eead4');
  }
}

function paintLink(link: dia.Link, value: Bit): void {
  const color = value ? '#4ade80' : '#64748b';
  link.attr('line/stroke', color);
  link.attr('line/targetMarker/fill', color);
  link.attr('line/strokeWidth', value ? 2.8 : 2.2);
}
