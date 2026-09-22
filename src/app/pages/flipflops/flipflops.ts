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
import { findFlipFlop, FLIPFLOPS } from '../../core/flipflop-library';
import type { Bit, FlipFlopForm } from '../../core/models';

@Component({
  selector: 'app-flipflops',
  template: `
    <div class="studio">
      <aside class="studio-side card lab-card">
        <h2 class="h6">Todas las formas</h2>
        <div class="list-group list-group-flush msi-list">
          @for (ff of forms; track ff.id) {
            <button class="list-group-item list-group-item-action" [class.active]="ff.id === selected().id" (click)="pick(ff.id)">
              <strong>{{ ff.name }}</strong>
              <small>{{ ff.family }} · {{ ff.trigger }}</small>
            </button>
          }
        </div>
      </aside>

      <section class="studio-canvas card lab-card">
        <div class="canvas-toolbar">
          <div>
            <strong>{{ selected().name }}</strong>
            <span class="chip ms-2">{{ selected().equation }}</span>
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-success" (click)="clockPulse()">Pulso CLK</button>
            <button class="btn btn-outline-light" (click)="q.set(0)">Reset Q</button>
          </div>
        </div>
        <p class="small text-secondary px-3">{{ selected().description }}</p>
        <div class="ff-layout">
          <article class="ff-symbol">
            <header>{{ selected().name }}</header>
            <div class="ff-body">
              <div>
                @for (name of selected().inputs; track name) {
                  <button class="dip-pin" [class.on]="inputOf(name) === 1" (click)="toggle(name)">{{ name }}={{ inputOf(name) }}</button>
                }
              </div>
              <div class="ff-box">
                <span>Q = {{ q() }}</span>
                <small>{{ selected().trigger }}</small>
              </div>
              <div>
                <div class="dip-pin out" [class.on]="q() === 1">Q={{ q() }}</div>
                <div class="dip-pin out" [class.on]="qn() === 1">Q'={{ qn() }}</div>
              </div>
            </div>
            @if (invalid()) {
              <p class="text-warning small mb-0 mt-2">Estado inválido: entradas prohibidas.</p>
            }
          </article>
          <div class="joint-host compact" #host></div>
        </div>
        <div class="row g-3 p-3">
          <div class="col-md-6">
            <h3 class="h6">Tabla característica</h3>
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  @for (k of charHeaders(); track k) {
                    <th>{{ k }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of selected().characteristic; track $index) {
                  <tr>
                    @for (k of charHeaders(); track k) {
                      <td>{{ cell(row, k) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="col-md-6">
            <h3 class="h6">Tabla de excitación</h3>
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  @for (k of excHeaders(); track k) {
                    <th>{{ k }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of selected().excitation; track $index) {
                  <tr>
                    @for (k of excHeaders(); track k) {
                      <td>{{ cell(row, k) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class FlipflopsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly forms = FLIPFLOPS;
  readonly selected = signal<FlipFlopForm>(FLIPFLOPS[0]);
  readonly pins = signal<Record<string, Bit>>({});
  readonly q = signal<Bit>(0);
  readonly qn = computed<Bit>(() => (this.invalid() ? 1 : this.q() ? 0 : 1));
  readonly invalid = signal(false);
  engine?: CircuitEngine;

  readonly charHeaders = computed(() => headersOf(this.selected().characteristic));
  readonly excHeaders = computed(() => headersOf(this.selected().excitation));

  constructor() {
    this.resetPins(FLIPFLOPS[0]);
    afterNextRender(() => {
      this.engine = new CircuitEngine(this.host().nativeElement);
      this.engine.loadNetlist(this.selected().netlist);
      this.destroyRef.onDestroy(() => this.engine?.destroy());
    });
  }

  pick(id: string): void {
    const ff = findFlipFlop(id);
    this.selected.set(ff);
    this.resetPins(ff);
    this.q.set(0);
    this.invalid.set(false);
    this.engine?.loadNetlist(ff.netlist);
  }

  inputOf(name: string): Bit {
    return this.pins()[name] ?? 0;
  }

  toggle(name: string): void {
    if (name === 'CLK') {
      this.clockPulse();
      return;
    }
    const next = { ...this.pins() };
    next[name] = next[name] ? 0 : 1;
    this.pins.set(next);
    this.apply(false);
  }

  clockPulse(): void {
    this.apply(true);
  }

  cell(row: FlipFlopForm['characteristic'][number], key: string): string {
    const bag: Record<string, Bit | string> = { ...row.inputs, ...row.outputs };
    if (row.note) bag['nota'] = row.note;
    const value = bag[key];
    return value === undefined || value === '' ? '—' : String(value);
  }

  private apply(edge: boolean): void {
    const next = this.selected().nextQ(this.q(), this.pins(), edge);
    if (next === 'invalid') {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.q.set(next);
    this.syncCanvas();
  }

  private resetPins(ff: FlipFlopForm): void {
    const rec: Record<string, Bit> = {};
    for (const name of ff.inputs) rec[name] = name.endsWith("'") ? 1 : 0;
    this.pins.set(rec);
  }

  private syncCanvas(): void {
    if (!this.engine) return;
    const pins = this.pins();
    for (const el of this.engine.graph.getElements()) {
      const label = el.prop('logic/label') as string;
      if (label in pins) el.prop('logic/value', pins[label]);
    }
    this.engine.simulate();
  }
}

function headersOf(rows: FlipFlopForm['characteristic']): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    Object.keys(row.inputs).forEach((k) => keys.add(k));
    Object.keys(row.outputs).forEach((k) => keys.add(k));
    if (row.note) keys.add('nota');
  }
  return [...keys];
}
