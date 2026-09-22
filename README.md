# Diagramador lógico

Laboratorio digital en **Angular 22**, **Bootstrap 5.3** y **JointJS 4.3** (`@joint/core`) para dibujar y simular circuitos integrados. Incluye **modo claro y oscuro** y está listo para **GitHub Pages**.

## Menú de diagramadores

- **Compuertas lógicas básicas** — AND, OR, NOT, NAND, NOR, XOR, XNOR, buffer, VCC/GND y clock con simulación en vivo.
- **Mapas de Karnaugh** — 2 a 6 variables, don’t care, SOP/POS e implicantes primos.
- **Circuitos MSI** — sumadores, restadores, comparadores, códigos, codificadores, decodificadores, MUX/DEMUX, paridad y ALU 74xx.
- **Decodificador y multiplexor** — 2-4 / 3-8 / 4-16, MUX 2:1 a 16:1 y demux, con bloque CI y netlist interno.
- **Flip-flops** — latches y FF SR, JK, D y T (nivel, flanco, maestro-esclavo, preset/clear) con tablas característica y de excitación.

## Arranque local

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. El conmutador **Modo claro / Modo oscuro** está en la barra lateral y guarda la preferencia en el navegador.

## GitHub Pages

El flujo `.github/workflows/deploy-pages.yml` construye la app y la publica en Pages.

1. Sube este proyecto a un repositorio propio.
2. En **Settings → Pages**, elige **GitHub Actions** como origen.
3. Haz push a `main` o `master`, o lanza el workflow a mano.

La URL queda en `https://<usuario>.github.io/<repositorio>/`. El build usa ese nombre como `base-href` y copia `index.html` a `404.html` para que las rutas de Angular (`/compuertas`, `/karnaugh`, etc.) funcionen al recargar.

Para un sitio de usuario (`usuario.github.io`) o un dominio propio, define la variable de repositorio `BASE_HREF` (por ejemplo `/`).

Build local idéntico al de Pages:

```bash
npm run build:pages
```
