import { Component, computed, signal } from '@angular/core';
import { buildLayout, cycleCell, minimize, VAR_NAMES, type KMapLayout } from '../../core/kmap';
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
              <button class="btn btn-sm btn-outline-light" (click)="fill(0)">Todo 0</button>
              <button class="btn btn-sm btn-outline-light" (click)="fill(1)">Todo 1</button>
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
    </div>
  `,
})
export class KarnaughPage {
  readonly vars = signal(4);
  readonly values = signal(new Map<number, CellValue>());
  readonly layout = computed(() => this.withValues(buildLayout(this.vars())));
  readonly names = computed(() => VAR_NAMES.slice(0, this.vars()));
  readonly result = computed(() => minimize(this.vars(), this.values()));
  readonly maps = computed(() => {
    const layout = this.layout();
    return Array.from({ length: layout.maps }, (_, index) => ({
      index,
      label: layout.mapLabels[index],
    }));
  });
  readonly rowIndexes = computed(() => Array.from({ length: this.layout().rows }, (_, i) => i));

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
