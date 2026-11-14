# FNAF 1 Web — Solo Noche 6 (IA 15/15/15/15) + contenido Beta + barra de cámara estilo FNAF Plus

Motor HTML5/JavaScript propio (sin librerías) que recrea las mecánicas de Five Nights at Freddy's 1.
**Este repo trae solo el código.** Las imágenes y sonidos se cargan desde **tu** carpeta de assets.

## 1. Poner tus assets

Copia la carpeta de tu `.rar` dentro de `assets/`, con el nombre exacto:

```
index.html
game.js
style.css
.nojekyll
assets/
  FNAF ASSETS REORGANIZED BY ENTEREST/
    0-STATIC/  1-MAIN_TEXT/  2-MENU_TWITCHING/  2.5-START_TO_END/  3-THE_OFFICE/
    4-CUSTOM_NIGHT/  5-NUMBERS/  6-CAMERAS/  7-NIGHT_LOADING/  8-EASTER_EGGS/  9-AUDIO/  OTHER_THINGS/
```

Si cambias el nombre de la carpeta, cambia `ASSET_ROOT` al inicio de `game.js`.
La Noche 6 no tiene llamada telefónica, así que puedes borrar `9-AUDIO/voiceover*.wav` y `ColdPresc B.wav` (unos 70 MB) para que el repo pese menos.

## 2. Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub y sube todo (código + carpeta `assets`).
   Con muchos archivos es más fácil usar GitHub Desktop o `git` que el navegador:
   ```
   git init && git add . && git commit -m "FNAF noche 6"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
2. En el repo: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
3. Espera 1–2 minutos y abre `https://TU_USUARIO.github.io/TU_REPO/`.

Para probarlo en tu PC, no abras el `index.html` con doble clic. Usa un servidor local
(`python -m http.server` dentro de la carpeta y entra a `http://localhost:8000`). Si no, el navegador
no deja quitar los fondos grises de los textos.

## Controles

| Acción | Ratón / táctil | Teclado |
|---|---|---|
| Mirar por la oficina | mover el ratón a los bordes | ← → |
| Puerta izq. / luz izq. | botón superior / inferior del panel | Q / A |
| Puerta der. / luz der. | botón superior / inferior del panel | E / D |
| Subir/bajar monitor | pasar el ratón por la barra de abajo (o tocarla) | Espacio o S |
| Cambiar cámara | clic en el mapa | 1=1A 2=1B 3=1C 4=2A 5=2B 6=3 7=4A 8=4B 9=5 0=6 -=7 |
| **Girar la cámara (FNAF Plus)** | arrastrar el **círculo** de la barra superior, o la rueda del ratón | A / D, ← → ; R = AUTO/MANUAL |
| Nariz de Freddy (honk) | clic en la nariz del póster | |
| Saltar a las 6 AM (debug original) | | mantener C + D + `+` |

## Qué hace igual que el original

- **IA 1–20 con oportunidades de movimiento**: Bonnie cada 4.97 s, Chica cada 4.98 s, Freddy cada 3.02 s y Foxy cada 5.01 s.
  En cada oportunidad se tira un número del 1 al 20, y el animatrónico se mueve si su IA (15) es mayor o igual.
  La IA se queda fija en 15 toda la noche.
- **Bonnie**: rutas al azar por el lado oeste (1A, 1B, 5, 2A, 3, 2B y la puerta izquierda).
  Si la puerta está cerrada, vuelve a 1B. Si entra, la puerta y la luz izquierdas dejan de funcionar y te ataca al bajar el monitor.
- **Chica**: 1A, 1B, 7, 6 (se oyen ollas en la cocina), 4A, 4B y la puerta derecha. Mismas reglas que Bonnie.
- **Freddy**: ruta fija 1A → 1B → 7 → 6 → 4A → 4B y oficina. Solo se mueve con el monitor bajado, se ríe al moverse
  y no sale del escenario hasta que Bonnie y Chica se van. Desde 4B entra si la puerta derecha está abierta y estás
  mirando otra cámara. En la cocina suena su caja de música.
- **Foxy**: 4 fases en Pirate Cove. Mientras miras cámaras no avanza, y al bajar el monitor queda bloqueado entre 0.83 y 16.67 s.
  Cuando sale, corre a los 25 s o al instante si miras 2A (se ve la animación de carrera).
  Si la puerta está cerrada, golpea y te quita 1 %, luego 6 %, 11 %… Si está abierta, te mata.
- **Energía**: el consumo crece con cada barra de uso (puertas, luz y monitor), más el gasto pasivo extra de la noche 5+.
  Al llegar a 0 pasa como en el original: apagón, Freddy en la puerta con la Toreador March y el jumpscare a oscuras.
- Interferencias en la cámara cuando algo se mueve, imágenes raras (IT'S ME, periódicos, niños, póster glitch, Bonnie de cerca),
  Golden Freddy (póster en 2B y luego en la oficina; si no subes el monitor en 5 s, te asusta y "crashea" al menú),
  alucinaciones, 6 AM con campanas y niños, y el cheque de horas extra.

## Contenido Beta (se puede activar o desactivar en el menú)

Basado en lo documentado en The Cutting Room Floor y la wiki de FNAF sobre los archivos del juego:

- **Sistema de vidas**: el contador "Lives" con el muñequito, que estaba en el código pero sin usar.
  Empiezas con 5 vidas. En el código original, perderlas todas te devolvía a la Noche 1; aquí reinicia la Noche 6.
- **Mapa beta del monitor**: el mapa con conos de cámara y las posiciones antiguas.
  Por ejemplo, Pirate Cove junto a la entrada de 2A, y la cámara de la cocina en la pared de la puerta.
- **Grito completo**: el jumpscare dura unos 5 s en el archivo, pero el juego lo cortaba a 1 s. Con la beta activa suena entero.
- **Imagen sin usar "todos mirando"** en el escenario (1A), como rareza.
- **Atajos de debug del original**: C+D+`+` para saltar a las 6 AM, y en el menú C+D+1 / C+D+2 para dar las estrellas.

## Ajustar posiciones

Si algún sprite queda desplazado, edita el objeto `LAYOUT` al inicio de `game.js`
(puertas, botones, ventilador, mapa, barra de giro de cámara…).
