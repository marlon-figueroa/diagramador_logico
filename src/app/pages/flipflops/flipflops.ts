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
import { clampTime, clockDigits, pad2, tickClock, type ClockMode, type ClockState } from '../../core/clock';
import { findFlipFlop, FLIPFLOPS } from '../../core/flipflop-library';
import type { Bit, FlipFlopForm } from '../../core/models';

@Component({
  selector: 'app-flipflops',
  template: `
    <div class="studio" [class.studio-clock]="isClock()">
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
          @if (!isClock()) {
            <div class="btn-group btn-group-sm">
              <button class="btn btn-success" (click)="clockPulse()">Pulso CLK</button>
              <button class="btn btn-outline-light" (click)="q.set(0)">Reset Q</button>
            </div>
          } @else {
            <div class="btn-group btn-group-sm">
              <button class="btn btn-success" [disabled]="running()" (click)="startClock()">Start</button>
              <button class="btn btn-outline-warning" [disabled]="!running()" (click)="stopClock()">Stop</button>
              <button class="btn btn-outline-light" (click)="resetClock()">Reset</button>
            </div>
          }
        </div>
        <p class="small text-secondary px-3">{{ selected().description }}</p>

        @if (isClock()) {
          <div class="clock-panel">
            <div class="clock-start">
              <label>
                Hora
                <input class="form-control form-control-sm" type="number" [min]="mode() === 12 ? 1 : 0" [max]="mode() === 12 ? 12 : 23" [value]="startH()" (input)="startH.set(num($event))" />
              </label>
              <label>
                Minutos
                <input class="form-control form-control-sm" type="number" min="0" max="59" [value]="startM()" (input)="startM.set(num($event))" />
              </label>
              <label>
                Segundos
                <input class="form-control form-control-sm" type="number" min="0" max="59" [value]="startS()" (input)="startS.set(num($event))" />
              </label>
              @if (mode() === 12) {
                <label>
                  AM/PM
                  <select class="form-select form-select-sm" [value]="startPm() ? 'PM' : 'AM'" (change)="startPm.set($any($event.target).value === 'PM')">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </label>
              }
              <button class="btn btn-sm btn-outline-light" [disabled]="running()" (click)="loadStart()">Cargar inicio</button>
            </div>

            <div class="clock-status">
              <span class="led-lamp" [class.green]="running()" [class.red]="!running()">
                {{ running() ? 'LED RUN' : 'LED STOP' }}
              </span>
              @if (mode() === 12) {
                <span class="led-lamp" [class.green]="!clock().pm" [class.red]="clock().pm">LED AM</span>
                <span class="led-lamp" [class.green]="clock().pm" [class.red]="!clock().pm">LED PM</span>
              }
              <strong class="clock-readout">{{ readout() }}</strong>
            </div>

            <div class="clock-digits">
              @for (digit of digits(); track digit.id; let i = $index) {
                @if (i === 2 || i === 4) {
                  <span class="clock-colon" [class.green]="clock().seconds % 2 === 0" [class.red]="clock().seconds % 2 === 1">:</span>
                }
                <div class="digit-block">
                  <div class="seg7" [attr.aria-label]="digit.id + '=' + digit.value">
                    @for (seg of digit.segments; track seg.id) {
                      <span class="seg" [class]="seg.id" [class.green]="seg.on" [class.red]="!seg.on"></span>
                    }
                  </div>
                  <small>{{ digit.id }}</small>
                  <div class="bcd-leds">
                    @for (bit of digit.bits; track bit.id) {
                      <span class="led-dot" [class.green]="bit.on" [class.red]="!bit.on" [title]="bit.id">{{ bit.id }}</span>
                    }
                  </div>
                </div>
              }
            </div>
            <p class="small text-secondary mb-0">Segmentos y bits BCD: <b class="text-success">verde = 1</b> · <b class="text-danger">rojo = 0</b></p>
          </div>
        }

        <div class="ff-layout">
          @if (!isClock()) {
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
          }
          <div class="joint-host" [class.compact]="!isClock()" #host></div>
        </div>
        <div class="row g-3 p-3">
          <div class="col-md-6">
            <h3 class="h6">{{ isClock() ? 'Cadena de acarreo' : 'Tabla característica' }}</h3>
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
            <h3 class="h6">{{ isClock() ? 'Excitación T-FF' : 'Tabla de excitación' }}</h3>
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
  readonly running = signal(false);
  readonly startH = signal(12);
  readonly startM = signal(0);
  readonly startS = signal(0);
  readonly startPm = signal(false);
  readonly clock = signal<ClockState>(clampTime(12, 12, 0, 0, false));
  engine?: CircuitEngine;
  private timer?: number;

  readonly isClock = computed(() => this.selected().family === 'clock');
  readonly mode = computed<ClockMode>(() => (this.selected().id === 'clock-24' ? 24 : 12));
  readonly digits = computed(() => clockDigits(this.clock()));
  readonly readout = computed(() => {
    const t = this.clock();
    const base = `${pad2(t.hours)}:${pad2(t.minutes)}:${pad2(t.seconds)}`;
    return this.mode() === 12 ? `${base} ${t.pm ? 'PM' : 'AM'}` : base;
  });
  readonly charHeaders = computed(() => headersOf(this.selected().characteristic));
  readonly excHeaders = computed(() => headersOf(this.selected().excitation));

  constructor() {
    this.resetPins(FLIPFLOPS[0]);
    afterNextRender(() => {
      this.engine = new CircuitEngine(this.host().nativeElement);
      this.engine.loadNetlist(this.selected().netlist);
      this.destroyRef.onDestroy(() => {
        this.stopClock();
        this.engine?.destroy();
      });
    });
  }

  pick(id: string): void {
    const ff = findFlipFlop(id);
    this.stopClock();
    this.selected.set(ff);
    this.resetPins(ff);
    this.q.set(0);
    this.invalid.set(false);
    if (ff.family === 'clock') {
      const mode: ClockMode = ff.id === 'clock-24' ? 24 : 12;
      this.startH.set(mode === 12 ? 12 : 0);
      this.startM.set(0);
      this.startS.set(0);
      this.startPm.set(false);
      this.clock.set(clampTime(mode, this.startH(), 0, 0, false));
    }
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

  startClock(): void {
    this.loadStart();
    this.running.set(true);
    this.syncClockCanvas();
    this.timer = window.setInterval(() => {
      this.clock.set(tickClock(this.clock(), this.mode()));
      this.syncClockCanvas();
    }, 1000);
  }

  stopClock(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    this.running.set(false);
  }

  resetClock(): void {
    this.stopClock();
    this.loadStart();
  }

  loadStart(): void {
    this.clock.set(clampTime(this.mode(), this.startH(), this.startM(), this.startS(), this.startPm()));
    this.syncClockCanvas();
  }

  num(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
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

  private syncClockCanvas(): void {
    if (!this.engine) return;
    const text = this.readout();
    for (const el of this.engine.graph.getElements()) {
      const kind = el.prop('logic/kind');
      if (kind === 'OUT') {
        el.prop('logic/label', text);
        el.prop('logic/value', this.running() ? 1 : 0);
      }
      if (kind === 'CLK') el.prop('logic/value', this.running() ? 1 : 0);
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
