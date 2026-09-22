import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CircuitEngine } from '../../core/circuit-engine';
import { bitsToInt, intToBits } from '../../core/logic';
import type { Bit, Netlist } from '../../core/models';

type Kind = 'decoder' | 'mux' | 'demux';

interface CompConfig {
  id: string;
  kind: Kind;
  name: string;
  part: string;
  selectBits: number;
  dataPins: number;
}

const CONFIGS: CompConfig[] = [
  { id: 'dec24', kind: 'decoder', name: 'Decodificador 2 a 4', part: '74139', selectBits: 2, dataPins: 4 },
  { id: 'dec38', kind: 'decoder', name: 'Decodificador 3 a 8', part: '74138', selectBits: 3, dataPins: 8 },
  { id: 'dec416', kind: 'decoder', name: 'Decodificador 4 a 16', part: '74154', selectBits: 4, dataPins: 16 },
  { id: 'mux21', kind: 'mux', name: 'Multiplexor 2:1', part: '74157', selectBits: 1, dataPins: 2 },
  { id: 'mux41', kind: 'mux', name: 'Multiplexor 4:1', part: '74153', selectBits: 2, dataPins: 4 },
  { id: 'mux81', kind: 'mux', name: 'Multiplexor 8:1', part: '74151', selectBits: 3, dataPins: 8 },
  { id: 'mux161', kind: 'mux', name: 'Multiplexor 16:1', part: '74150', selectBits: 4, dataPins: 16 },
  { id: 'demux14', kind: 'demux', name: 'Demultiplexor 1:4', part: 'demux', selectBits: 2, dataPins: 4 },
  { id: 'demux18', kind: 'demux', name: 'Demultiplexor 1:8', part: '74138', selectBits: 3, dataPins: 8 },
];

@Component({
  selector: 'app-componentes',
  template: `
    <div class="studio">
      <aside class="studio-side card lab-card">
        <h2 class="h6">Componentes MSI</h2>
        <div class="list-group list-group-flush msi-list">
          @for (c of configs; track c.id) {
            <button class="list-group-item list-group-item-action" [class.active]="c.id === config().id" (click)="pick(c)">
              <strong>{{ c.name }}</strong>
              <small>{{ c.part }}</small>
            </button>
          }
        </div>
        <hr class="border-secondary-subtle" />
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" [checked]="enable()" (change)="enable.set($any($event.target).checked)" />
          <label class="form-check-label">Enable activo</label>
        </div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" [checked]="activeLow()" (change)="activeLow.set($any($event.target).checked)" />
          <label class="form-check-label">Salidas activas en bajo</label>
        </div>
      </aside>

      <section class="studio-canvas card lab-card">
        <div class="canvas-toolbar">
          <strong>{{ config().name }}</strong>
          <span class="chip">{{ config().part }}</span>
        </div>
        <div class="component-grid">
          <article class="block-ic">
            <h3>{{ symbolName() }}</h3>
            <div class="block-cols">
              <div>
                @for (sel of selects(); track sel.id) {
                  <button class="dip-pin" [class.on]="sel.value === 1" (click)="toggleSelect(sel.i)">{{ sel.id }}={{ sel.value }}</button>
                }
                @if (config().kind === 'demux') {
                  <button class="dip-pin" [class.on]="data() === 1" (click)="data.set(data() ? 0 : 1)">D={{ data() }}</button>
                }
                @if (config().kind === 'mux') {
                  @for (d of dataBits(); track d.id) {
                    <button class="dip-pin" [class.on]="d.value === 1" (click)="toggleData(d.i)">{{ d.id }}={{ d.value }}</button>
                  }
                }
                <div class="dip-pin" [class.on]="enable()">E={{ enable() ? 1 : 0 }}</div>
              </div>
              <div class="block-body">{{ config().kind.toUpperCase() }}</div>
              <div>
                @for (y of outputs(); track y.id) {
                  <div class="dip-pin out" [class.on]="y.value === 1">{{ y.id }}={{ y.value }}</div>
                }
              </div>
            </div>
          </article>
          <div class="joint-host compact" #host></div>
        </div>
      </section>

      <aside class="studio-side card lab-card">
        <h2 class="h6">Dirección</h2>
        <p class="mb-1">Índice seleccionado: <b>{{ index() }}</b></p>
        <p class="small text-secondary">Y = D[S] en MUX · Yn = E·m(S) en decodificador · Yn = D si n=S en demux.</p>
        <hr class="border-secondary-subtle" />
        @for (y of outputs(); track y.id) {
          <div class="probe-out" [class.on]="y.value === 1">{{ y.id }} <b>{{ y.value }}</b></div>
        }
      </aside>
    </div>
  `,
})
export class ComponentesPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly configs = CONFIGS;
  readonly config = signal(CONFIGS[1]);
  readonly enable = signal(true);
  readonly activeLow = signal(false);
  readonly selectBits = signal<Bit[]>([0, 0, 0, 0]);
  readonly dataWord = signal<Bit[]>(Array.from({ length: 16 }, () => 0 as Bit));
  readonly data = signal<Bit>(1);
  engine?: CircuitEngine;

  readonly index = computed(() => {
    const bits = this.selectBits().slice(0, this.config().selectBits);
    return bitsToInt(bits);
  });

  readonly selects = computed(() =>
    Array.from({ length: this.config().selectBits }, (_, i) => ({
      i,
      id: `S${this.config().selectBits - 1 - i}`,
      value: this.selectBits()[i] ?? 0,
    })),
  );

  readonly dataBits = computed(() =>
    Array.from({ length: this.config().dataPins }, (_, i) => ({
      i,
      id: `D${i}`,
      value: this.dataWord()[i] ?? 0,
    })),
  );

  readonly outputs = computed(() => {
    const cfg = this.config();
    const idx = this.index();
    const en = this.enable();
    const low = this.activeLow();
    const invert = (v: Bit): Bit => (low ? ((v ? 0 : 1) as Bit) : v);
    if (cfg.kind === 'decoder') {
      return Array.from({ length: cfg.dataPins }, (_, i) => ({
        id: `Y${i}`,
        value: invert(en && i === idx ? 1 : 0),
      }));
    }
    if (cfg.kind === 'mux') {
      const y = en ? (this.dataWord()[idx] ?? 0) : 0;
      return [{ id: 'Y', value: invert(y) }];
    }
    return Array.from({ length: cfg.dataPins }, (_, i) => ({
      id: `Y${i}`,
      value: invert(en && i === idx ? this.data() : 0),
    }));
  });

  readonly symbolName = computed(() => `${this.config().name}`);

  constructor() {
    afterNextRender(() => {
      this.engine = new CircuitEngine(this.host().nativeElement);
      this.draw();
      this.destroyRef.onDestroy(() => this.engine?.destroy());
    });
  }

  pick(cfg: CompConfig): void {
    this.config.set(cfg);
    this.selectBits.set(intToBits(0, 4));
    this.draw();
  }

  toggleSelect(i: number): void {
    const next = this.selectBits().slice() as Bit[];
    next[i] = next[i] ? 0 : 1;
    this.selectBits.set(next);
    this.draw();
  }

  toggleData(i: number): void {
    const next = this.dataWord().slice() as Bit[];
    next[i] = next[i] ? 0 : 1;
    this.dataWord.set(next);
    this.draw();
  }

  private draw(): void {
    this.engine?.loadNetlist(this.netlist());
  }

  private netlist(): Netlist {
    const cfg = this.config();
    if (cfg.kind === 'mux' && cfg.dataPins === 2) {
      return {
        nodes: [
          { id: 'D0', kind: 'IN', x: 30, y: 40, label: 'D0' },
          { id: 'D1', kind: 'IN', x: 30, y: 140, label: 'D1' },
          { id: 'S', kind: 'IN', x: 30, y: 240, label: 'S' },
          { id: 'NS', kind: 'NOT', x: 180, y: 240, label: "S'" },
          { id: 'A0', kind: 'AND', x: 330, y: 50, label: 'AND' },
          { id: 'A1', kind: 'AND', x: 330, y: 150, label: 'AND' },
          { id: 'O', kind: 'OR', x: 500, y: 100, label: 'OR' },
          { id: 'Y', kind: 'OUT', x: 660, y: 100, label: 'Y' },
        ],
        wires: [
          { from: 'S', to: 'NS' },
          { from: 'D0', to: 'A0', fromPort: 'out', toPort: 'in1' },
          { from: 'NS', to: 'A0', fromPort: 'out', toPort: 'in2' },
          { from: 'D1', to: 'A1', fromPort: 'out', toPort: 'in1' },
          { from: 'S', to: 'A1', fromPort: 'out', toPort: 'in2' },
          { from: 'A0', to: 'O', fromPort: 'out', toPort: 'in1' },
          { from: 'A1', to: 'O', fromPort: 'out', toPort: 'in2' },
          { from: 'O', to: 'Y' },
        ],
      };
    }
    if (cfg.kind === 'decoder' && cfg.selectBits === 2) {
      return {
        nodes: [
          { id: 'A1', kind: 'IN', x: 30, y: 40, label: 'A1' },
          { id: 'A0', kind: 'IN', x: 30, y: 140, label: 'A0' },
          { id: 'N1', kind: 'NOT', x: 180, y: 40, label: "A1'" },
          { id: 'N0', kind: 'NOT', x: 180, y: 140, label: "A0'" },
          { id: 'G0', kind: 'AND', x: 340, y: 30, label: 'Y0' },
          { id: 'G1', kind: 'AND', x: 340, y: 110, label: 'Y1' },
          { id: 'G2', kind: 'AND', x: 340, y: 190, label: 'Y2' },
          { id: 'G3', kind: 'AND', x: 340, y: 270, label: 'Y3' },
          { id: 'Y0', kind: 'OUT', x: 520, y: 30, label: 'Y0' },
          { id: 'Y1', kind: 'OUT', x: 520, y: 110, label: 'Y1' },
          { id: 'Y2', kind: 'OUT', x: 520, y: 190, label: 'Y2' },
          { id: 'Y3', kind: 'OUT', x: 520, y: 270, label: 'Y3' },
        ],
        wires: [
          { from: 'A1', to: 'N1' },
          { from: 'A0', to: 'N0' },
          { from: 'N1', to: 'G0', fromPort: 'out', toPort: 'in1' },
          { from: 'N0', to: 'G0', fromPort: 'out', toPort: 'in2' },
          { from: 'N1', to: 'G1', fromPort: 'out', toPort: 'in1' },
          { from: 'A0', to: 'G1', fromPort: 'out', toPort: 'in2' },
          { from: 'A1', to: 'G2', fromPort: 'out', toPort: 'in1' },
          { from: 'N0', to: 'G2', fromPort: 'out', toPort: 'in2' },
          { from: 'A1', to: 'G3', fromPort: 'out', toPort: 'in1' },
          { from: 'A0', to: 'G3', fromPort: 'out', toPort: 'in2' },
          { from: 'G0', to: 'Y0' },
          { from: 'G1', to: 'Y1' },
          { from: 'G2', to: 'Y2' },
          { from: 'G3', to: 'Y3' },
        ],
      };
    }
    const sel = this.selects();
    return {
      nodes: [
        ...sel.map((s, i) => ({ id: s.id, kind: 'IN' as const, x: 40, y: 40 + i * 70, label: s.id })),
        { id: 'IC', kind: 'IC', x: 280, y: 80, label: cfg.part },
        { id: 'Y', kind: 'OUT', x: 520, y: 90, label: cfg.kind === 'mux' ? 'Y' : `Y${this.index()}` },
      ],
      wires: [
        ...sel.map((s) => ({ from: s.id, to: 'IC', fromPort: 'out', toPort: 'in1' })),
        { from: 'IC', to: 'Y' },
      ],
    };
  }
}
