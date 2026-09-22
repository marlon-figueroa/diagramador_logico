import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENU } from '../../core/catalog';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="home-hero card lab-card">
      <div class="row g-4 align-items-center">
        <div class="col-lg-7">
          <p class="lab-kicker">Índice del laboratorio</p>
          <h2 class="display-6 fw-semibold mb-3">Todos los diagramadores en un solo menú</h2>
          <p class="lead text-secondary mb-3">
            Diseña compuertas IEEE, minimiza funciones con mapas de Karnaugh de 2 a 6 variables,
            inspecciona circuitos MSI 74xx, configura decodificadores y multiplexores, y recorre
            todas las formas de latches y flip-flops.
          </p>
          <a class="btn btn-sm lab-help-btn" routerLink="/ayuda">
            <i class="bi bi-question-circle"></i> Cómo usar el menú
          </a>
        </div>
        <div class="col-lg-5">
          <ul class="list-unstyled home-stack mb-0">
            <li><i class="bi bi-check2-circle"></i> Lienzo JointJS con pines, ruteo ortogonal y simulación</li>
            <li><i class="bi bi-check2-circle"></i> Símbolos de CI, tablas de verdad y netlist interno</li>
            <li><i class="bi bi-check2-circle"></i> Bootstrap 5.3 para la interfaz del laboratorio</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mt-4">
      <div class="d-flex justify-content-between align-items-end mb-3">
        <h3 class="h5 mb-0">Menú de diagramadores</h3>
        <span class="text-secondary small">{{ menu.length }} estaciones</span>
      </div>
      <div class="row g-4">
        @for (item of menu; track item.id; let i = $index) {
          <div class="col-md-6 col-xl-4">
            <a class="menu-card card lab-card h-100 {{ item.accent }}" [routerLink]="item.route">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <span class="menu-icon"><i class="bi" [class]="item.icon"></i></span>
                  <span class="menu-index">0{{ i + 1 }}</span>
                </div>
                <h3 class="h5 mt-3">{{ item.title }}</h3>
                <p class="text-secondary">{{ item.subtitle }}</p>
                <div class="d-flex flex-wrap gap-2">
                  @for (topic of item.topics; track topic) {
                    <span class="chip">{{ topic }}</span>
                  }
                </div>
              </div>
            </a>
          </div>
        }
      </div>
    </section>
  `,
})
export class HomePage {
  readonly menu = MENU;
}
