import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENU_HELP } from '../../core/catalog';

@Component({
  selector: 'app-ayuda',
  imports: [RouterLink],
  template: `
    <section class="card lab-card p-4 mb-4">
      <p class="lab-kicker">Guía del laboratorio</p>
      <h2 class="h3 mb-2">Ayuda del menú</h2>
      <p class="text-secondary mb-0">
        Cada opción del menú izquierdo abre un diagramador. Esta guía explica para qué sirve y cómo usarla.
      </p>
    </section>

    <div class="row g-3">
      @for (item of help; track item.id) {
        <article class="col-lg-6">
          <div class="card lab-card h-100 p-3">
            <div class="d-flex align-items-start gap-3">
              <span class="menu-icon"><i class="bi" [class]="item.icon"></i></span>
              <div>
                <h3 class="h5 mb-1">{{ item.title }}</h3>
                <p class="text-secondary">{{ item.summary }}</p>
                <ol class="help-steps">
                  @for (step of item.steps; track step) {
                    <li>{{ step }}</li>
                  }
                </ol>
                @if (item.route) {
                  <a class="btn btn-sm lab-help-btn" [routerLink]="item.route">Abrir {{ item.title }}</a>
                }
              </div>
            </div>
          </div>
        </article>
      }
    </div>
  `,
})
export class AyudaPage {
  readonly help = MENU_HELP;
}
