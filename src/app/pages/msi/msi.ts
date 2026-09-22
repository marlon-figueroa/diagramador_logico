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
import { findIc, MSI_CATEGORIES, MSI_LIBRARY } from '../../core/msi-library';
import type { Bit, IcDefinition } from '../../core/models';

@Component({
  selector: 'app-msi',
  template: `
    <div class="studio">
      <aside class="studio-side card lab-card">
        <h2 class="h6">Circuitos MSI</h2>
        <label class="form-label small">Familia</label>
        <select class="form-select form-select-sm mb-2" [value]="category()" (change)="category.set($any($event.target).value)">
          <option value="all">Todas</option>
          @for (c of categories; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
        <div class="list-group list-group-flush msi-list">
          @for (ic of filtered(); track ic.id) {
            <button type="button" class="list-group-item list-group-item-action" [class.active]="ic.id === selected().id" (click)="select(ic.id)">
              <strong>{{ ic.name }}</strong>
              <small>{{ ic.part || ic.category }}</small>
            </button>
          }
        </div>
      </aside>

      <section class="studio-canvas card lab-card">
        <div class="canvas-toolbar">
          <div>
            <strong>{{ selected().name }}</strong>
            @if (selected().part) {
              <span class="chip ms-2">{{ selected().part }}</span>
            }
          </div>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-light" [class.active]="view() === 'gates'" (click)="showGates()">Nivel compuerta</button>
            <button class="btn btn-outline-light" [class.active]="view() === 'ic'" (click)="view.set('ic')">Bloque CI</button>
          </div>
        </div>
        <p class="small text-secondary px-3 mb-2">{{ selected().description }}</p>
        <div class="joint-host" #host [class.d-none]="view() !== 'gates'"></div>
        @if (view() === 'ic') {
          <div class="ic-board">
            <article class="dip">
              <header>{{ selected().part || selected().name }}</header>
              <div class="dip-body">
                <div>
                  @for (pin of selected().inputs; track pin.id) {
                    <button type="button" class="dip-pin" [class.on]="inputs()[pin.id] === 1" (click)="toggle(pin.id)">
                      {{ pin.label }} · {{ inputs()[pin.id] }}
                    </button>
                  }
                </div>
                <div class="dip-notch"></div>
                <div>
                  @for (pin of selected().outputs; track pin.id) {
                    <div class="dip-pin out" [class.on]="outputs()[pin.id] === 1">
                      {{ pin.label }} · {{ outputs()[pin.id] }}
                    </div>
                  }
                </div>
              </div>
            </article>
          </div>
        }
      </section>

      <aside class="studio-side card lab-card">
        <h2 class="h6">Pines y evaluación</h2>
        <p class="small text-secondary">Conmuta entradas. La función MSI se recalcula al instante.</p>
        @for (pin of selected().inputs; track pin.id) {
          <button class="probe-toggle" [class.on]="inputs()[pin.id] === 1" (click)="toggle(pin.id)">
            {{ pin.label }} <b>{{ inputs()[pin.id] }}</b>
          </button>
        }
        <hr class="border-secondary-subtle" />
        @for (pin of selected().outputs; track pin.id) {
          <div class="probe-out" [class.on]="outputs()[pin.id] === 1">
            {{ pin.label }} <b>{{ outputs()[pin.id] }}</b>
          </div>
        }
      </aside>
    </div>
  `,
})
export class MsiPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly categories = MSI_CATEGORIES;
  readonly category = signal('all');
  readonly selected = signal<IcDefinition>(MSI_LIBRARY[0]);
  readonly view = signal<'gates' | 'ic'>('ic');
  readonly inputs = signal<Record<string, Bit>>({});
  readonly outputs = computed(() => this.selected().evaluate(this.inputs()));
  readonly filtered = computed(() =>
    MSI_LIBRARY.filter((ic) => this.category() === 'all' || ic.category === this.category()),
  );
  engine?: CircuitEngine;

  constructor() {
    this.resetInputs(MSI_LIBRARY[0]);
    afterNextRender(() => this.bindEngine());
  }

  select(id: string): void {
    const ic = findIc(id);
    this.selected.set(ic);
    this.resetInputs(ic);
    if (this.view() === 'gates') this.drawNet(ic);
  }

  showGates(): void {
    this.view.set('gates');
    queueMicrotask(() => {
      this.engine?.fit();
      this.drawNet(this.selected());
    });
  }

  toggle(id: string): void {
    const next = { ...this.inputs() };
    next[id] = next[id] ? 0 : 1;
    this.inputs.set(next);
    this.syncCanvasInputs();
  }

  private resetInputs(ic: IcDefinition): void {
    const rec: Record<string, Bit> = {};
    for (const pin of ic.inputs) rec[pin.id] = pin.id === 'E' || pin.id === 'EI' ? 1 : 0;
    this.inputs.set(rec);
  }

  private bindEngine(): void {
    const el = this.host().nativeElement;
    this.engine?.destroy();
    this.engine = new CircuitEngine(el);
    this.destroyRef.onDestroy(() => this.engine?.destroy());
    this.drawNet(this.selected());
  }

  private drawNet(ic: IcDefinition): void {
    if (!this.engine) return;
    if (ic.netlist) this.engine.loadNetlist(ic.netlist);
    else this.engine.clear();
    this.syncCanvasInputs();
  }

  private syncCanvasInputs(): void {
    if (!this.engine) return;
    const values = this.inputs();
    for (const el of this.engine.graph.getElements()) {
      const label = el.prop('logic/label') as string;
      if (label in values && (el.prop('logic/kind') === 'IN' || el.prop('logic/kind') === 'CLK')) {
        el.prop('logic/value', values[label]);
      }
    }
    this.engine.simulate();
  }
}
