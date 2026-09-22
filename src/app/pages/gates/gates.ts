import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { GATE_PALETTE } from '../../core/catalog';
import { CircuitEngine } from '../../core/circuit-engine';
import type { GateKind, Netlist } from '../../core/models';

const EXAMPLES: { id: string; name: string; net: Netlist }[] = [
  {
    id: 'empty',
    name: 'Lienzo vacío',
    net: { nodes: [], wires: [] },
  },
  {
    id: 'xor-nand',
    name: 'XOR con NAND',
    net: {
      nodes: [
        { id: 'A', kind: 'IN', x: 40, y: 60, label: 'A' },
        { id: 'B', kind: 'IN', x: 40, y: 220, label: 'B' },
        { id: 'N1', kind: 'NAND', x: 220, y: 60, label: 'NAND' },
        { id: 'N2', kind: 'NAND', x: 220, y: 160, label: 'NAND' },
        { id: 'N3', kind: 'NAND', x: 220, y: 260, label: 'NAND' },
        { id: 'N4', kind: 'NAND', x: 420, y: 160, label: 'NAND' },
        { id: 'Y', kind: 'OUT', x: 620, y: 160, label: 'Y' },
      ],
      wires: [
        { from: 'A', to: 'N1', fromPort: 'out', toPort: 'in1' },
        { from: 'B', to: 'N1', fromPort: 'out', toPort: 'in2' },
        { from: 'A', to: 'N2', fromPort: 'out', toPort: 'in1' },
        { from: 'N1', to: 'N2', fromPort: 'out', toPort: 'in2' },
        { from: 'B', to: 'N3', fromPort: 'out', toPort: 'in1' },
        { from: 'N1', to: 'N3', fromPort: 'out', toPort: 'in2' },
        { from: 'N2', to: 'N4', fromPort: 'out', toPort: 'in1' },
        { from: 'N3', to: 'N4', fromPort: 'out', toPort: 'in2' },
        { from: 'N4', to: 'Y', fromPort: 'out', toPort: 'in1' },
      ],
    },
  },
  {
    id: 'half',
    name: 'Sumador medio',
    net: {
      nodes: [
        { id: 'A', kind: 'IN', x: 40, y: 70, label: 'A' },
        { id: 'B', kind: 'IN', x: 40, y: 210, label: 'B' },
        { id: 'X', kind: 'XOR', x: 240, y: 70, label: 'XOR' },
        { id: 'A1', kind: 'AND', x: 240, y: 220, label: 'AND' },
        { id: 'S', kind: 'OUT', x: 460, y: 70, label: 'S' },
        { id: 'C', kind: 'OUT', x: 460, y: 220, label: 'C' },
      ],
      wires: [
        { from: 'A', to: 'X', fromPort: 'out', toPort: 'in1' },
        { from: 'B', to: 'X', fromPort: 'out', toPort: 'in2' },
        { from: 'A', to: 'A1', fromPort: 'out', toPort: 'in1' },
        { from: 'B', to: 'A1', fromPort: 'out', toPort: 'in2' },
        { from: 'X', to: 'S' },
        { from: 'A1', to: 'C' },
      ],
    },
  },
];

@Component({
  selector: 'app-gates',
  template: `
    <div class="studio">
      <aside class="studio-side card lab-card">
        <h2 class="h6">Paleta IEEE</h2>
        <p class="small text-secondary">Haz clic para colocar. Arrastra pines de salida hacia entradas.</p>
        <div class="palette">
          @for (item of palette; track item.kind) {
            <button type="button" class="palette-btn" (click)="add(item.kind, item.inputs)">
              <i class="bi" [class]="item.icon"></i>
              {{ item.label }}
            </button>
          }
        </div>
        <hr class="border-secondary-subtle" />
        <label class="form-label small">Ejemplos</label>
        <select class="form-select form-select-sm" (change)="load($any($event.target).value)">
          @for (ex of examples; track ex.id) {
            <option [value]="ex.id">{{ ex.name }}</option>
          }
        </select>
      </aside>

      <section class="studio-canvas card lab-card">
        <div class="canvas-toolbar">
          <strong>Compuertas lógicas básicas</strong>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-light" (click)="engine?.zoom(-0.1)"><i class="bi bi-zoom-out"></i></button>
            <button class="btn btn-outline-light" (click)="engine?.fit()">Ajustar</button>
            <button class="btn btn-outline-light" (click)="engine?.zoom(0.1)"><i class="bi bi-zoom-in"></i></button>
            <button class="btn btn-outline-warning" (click)="engine?.clear()">Limpiar</button>
          </div>
        </div>
        <div class="joint-host" #host></div>
      </section>

      <aside class="studio-side card lab-card">
        <h2 class="h6">Simulación</h2>
        <p class="small text-secondary">Clic en una entrada o clock para conmutar 0/1. El cable verde es lógico 1.</p>
        <ul class="probe-list">
          @for (row of probes(); track row.label) {
            <li>
              <span>{{ row.label }}</span>
              <b [class.on]="row.value === 1">{{ row.value }}</b>
            </li>
          }
        </ul>
      </aside>
    </div>
  `,
})
export class GatesPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly palette = GATE_PALETTE;
  readonly examples = EXAMPLES;
  readonly probes = signal<{ label: string; value: 0 | 1 }[]>([]);
  engine?: CircuitEngine;

  constructor() {
    afterNextRender(() => {
      this.engine = new CircuitEngine(this.host().nativeElement, {
        onChange: () => this.refresh(),
      });
      this.engine.loadNetlist(EXAMPLES[2].net);
      this.destroyRef.onDestroy(() => this.engine?.destroy());
    });
  }

  add(kind: GateKind, inputs?: number): void {
    this.engine?.addGate(kind, 160 + Math.random() * 80, 80 + Math.random() * 160, kind, inputs);
  }

  load(id: string): void {
    const example = EXAMPLES.find((e) => e.id === id);
    if (example) this.engine?.loadNetlist(example.net);
  }

  private refresh(): void {
    const snap = this.engine?.snapshot().labels ?? {};
    this.probes.set(Object.entries(snap).map(([label, value]) => ({ label, value })));
  }
}
