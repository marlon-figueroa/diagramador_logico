import { Injectable, signal } from '@angular/core';

export type LabTheme = 'light' | 'dark';

const STORAGE_KEY = 'lab-theme';

function readTheme(): LabTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  } catch {
    /* storage o matchMedia no disponibles */
  }
  return 'dark';
}

function applyDom(theme: LabTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-bs-theme', theme);
  root.style.colorScheme = theme;
  root.dispatchEvent(new CustomEvent('lab-theme', { detail: theme }));
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<LabTheme>(readTheme());

  constructor() {
    applyDom(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: LabTheme): void {
    this.theme.set(theme);
    applyDom(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore quota / private mode */
    }
  }
}
