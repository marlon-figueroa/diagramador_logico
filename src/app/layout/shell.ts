import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MENU } from '../core/catalog';
import { ThemeService } from '../core/theme';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  readonly menu = MENU;
  readonly theme = inject(ThemeService);
}
