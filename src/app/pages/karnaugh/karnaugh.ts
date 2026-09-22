import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  buildLayout,
  cycleCell,
  diagramMinimized,
  minimize,
  VAR_NAMES,
  type KMapForm,
  type KMapLayout,
} from '../../core/kmap';
import { CircuitEngine } from '../../core/circuit-engine';
import type { CellValue } from '../../core/models';

@Component({
  selector: 'app-karnaugh',
  template: `
    <div class="kmap-page">
      <section class="card lab-card p-3 mb-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-3">
            <label class="form-label">Variables</label>
            <select class="form-select" [value]="vars()" (change)="setVars(+$any($event.target).value)">
              @for (n of [2, 3, 4, 5, 6]; track n) {
                <option [value]="n" [selected]="vars() === n">{{ n }} · {{ labelFor(n) }}</option>
              }
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Clic en celda: 0 → 1 → X</label>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm lab-help-btn" (click)="fill(0)">Todo 0</button>
              <button class="btn btn-sm lab-help-btn" (click)="fill(1)">Todo 1</button>
              <button class="btn btn-sm btn-outline-warning" (click)="fill('X')">Don’t care</button>
            </div>
          </div>
          <div class="col-md-3 text-md-end">
            <div class="eq-box">
              <small>SOP</small>
              <strong>{{ result().sop }}</strong>
              <small>POS</small>
              <strong>{{ result().pos }}</strong>
            </div>
          </div>
        </div>
      </section>

      <div class="row g-3">
        @for (map of maps(); track map.index) {
          <div class="col-xl-6">
            <article class="card lab-card p-3 h-100">
              <h3 class="h6">{{ map.label }}</h3>
              <div class="kmap" [style.--cols]="layout().cols">
                <div class="kmap-corner">{{ names().join('') }}</div>
                @for (col of layout().colLabels; track col) {
                  <div class="kmap-head">{{ col }}</div>
                }
                @for (r of rowIndexes(); track r) {
                  <div class="kmap-head">{{ layout().rowLabels[r] }}</div>
                  @for (cell of cellsOf(map.index, r); track cell.minterm) {
                    <button
                      type="button"
                      class="kmap-cell"
                      [class.one]="cell.value === 1"
                      [class.dc]="cell.value === 'X'"
                      [class.grouped]="isGrouped(cell.minterm)"
                      (click)="toggle(cell.minterm)"
                    >
                      <span class="mt">m{{ cell.minterm }}</span>
                      <b>{{ cell.value }}</b>
                    </button>
                  }
                }
              </div>
            </article>
          </div>
        }
      </div>

      <section class="card lab-card p-3 mt-3">
        <h3 class="h6">Implicantes primos esenciales</h3>
        @if (!result().primes.length) {
          <p class="text-secondary mb-0">No hay minitérminos en 1.</p>
        } @else {
          <div class="d-flex flex-wrap gap-2">
            @for (p of result().primes; track p.pattern) {
              <span class="chip">{{ p.pattern }} · m({{ p.minterms.join(',') }})</span>
            }
          </div>
        }
      </section>

      <section class="card lab-card p-0 mt-3 kmap-circuit">
        <div class="canvas-toolbar">
          <div>
            <h3 class="h6 mb-1">Circuito del resultado</h3>
            <p class="small text-secondary mb-0">
              {{ form() === 'sop' ? result().sop : result().pos }}
              · Clic en las entradas para simular Y
            </p>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn lab-help-btn" [class.active]="form() === 'sop'" (click)="setForm('sop')">
                SOP
              </button>
              <button type="button" class="btn lab-help-btn" [class.active]="form() === 'pos'" (click)="setForm('pos')">
                POS
              </button>
            </div>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn lab-help-btn" (click)="engine?.zoom(-0.1)">
                <i class="bi bi-zoom-out"></i>
              </button>
              <button type="button" class="btn lab-help-btn" (click)="engine?.fit()">Ajustar</button>
              <button type="button" class="btn lab-help-btn" (click)="engine?.zoom(0.1)">
                <i class="bi bi-zoom-in"></i>
              </button>
            </div>
            <span class="chip" [class.on]="yBit() === 1">Y = {{ yBit() }}</span>
          </div>
        </div>
        <div class="joint-host compact" #host></div>
      </section>
    </div>
  `,
})
export class KarnaughPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly vars = signal(4);
  readonly values = signal(new Map<number, CellValue>());
  readonly form = signal<KMapForm>('sop');
  readonly yBit = signal<0 | 1>(0);
  readonly layout = computed(() => this.withValues(buildLayout(this.vars())));
  readonly names = computed(() => VAR_NAMES.slice(0, this.vars()));
  readonly result = computed(() => minimize(this.vars(), this.values()));
  readonly diagram = computed(() => diagramMinimized(this.vars(), this.result(), this.form()));
  readonly maps = computed(() => {
    const layout = this.layout();
    return Array.from({ length: layout.maps }, (_, index) => ({
      index,
      label: layout.mapLabels[index],
    }));
  });
  readonly rowIndexes = computed(() => Array.from({ length: this.layout().rows }, (_, i) => i));
  engine?: CircuitEngine;

  constructor() {
    afterNextRender(() => {
      this.engine = new CircuitEngine(this.host().nativeElement, {
        onChange: () => this.yBit.set(this.engine?.snapshot().labels['Y'] ?? 0),
      });
      this.engine.loadNetlist(this.diagram());
      this.destroyRef.onDestroy(() => this.engine?.destroy());
    });

    effect(() => {
      const net = this.diagram();
      untracked(() => this.engine?.loadNetlist(net));
    });
  }

  cellsOf(map: number, row: number) {
    return this.layout().cells.filter((c) => c.map === map && c.row === row);
  }

  labelFor(n: number): string {
    return VAR_NAMES.slice(0, n).join('');
  }

  setVars(n: number): void {
    this.vars.set(n);
    this.values.set(new Map());
  }

  setForm(form: KMapForm): void {
    this.form.set(form);
  }

  toggle(minterm: number): void {
    const next = new Map(this.values());
    next.set(minterm, cycleCell(next.get(minterm) ?? 0));
    this.values.set(next);
  }

  fill(v: CellValue): void {
    const next = new Map<number, CellValue>();
    const max = 1 << this.vars();
    for (let i = 0; i < max; i++) next.set(i, v);
    this.values.set(next);
  }

  isGrouped(minterm: number): boolean {
    return this.result().primes.some((p) => p.minterms.includes(minterm));
  }

  private withValues(layout: KMapLayout): KMapLayout {
    const values = this.values();
    return {
      ...layout,
      cells: layout.cells.map((c) => ({ ...c, value: values.get(c.minterm) ?? 0 })),
    };
  }
}
