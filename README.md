# Purgatory — FNAF 1 web (Noche 6 + Boss Fight hasta las 9 AM)

Motor HTML5/JavaScript propio. Las imágenes y sonidos se cargan desde **tus** assets.

## Opción A: con paquetes `.pak` (la más fácil para GitHub)

1. Abre **`empaquetador.html`** con doble clic y elige tu `.rar` (o la carpeta descomprimida).
2. Pulsa **"Descargar todos"** y obtendrás `fnaf-assets-1.pak` … `fnaf-assets-9.pak` (menos de 25 MB cada uno).
3. En GitHub ve a **Add file → Upload files** y arrastra juntos `index.html`, `style.css`, `assets.js`, `game.js` y los `.pak`.
4. Ve a **Settings → Pages → main / (root) → Save**.

> Si ya tenías `.pak` de una versión anterior, vuelve a crearlos: ahora incluyen la llamada de la Noche 5 (`voiceover5.wav`).

## Opción B: con la carpeta de assets

Pon la carpeta descomprimida con el nombre **`FiveNightAtFreddyBearASSets`** dentro de `assets/`:

```
index.html  style.css  assets.js  game.js
assets/
  FiveNightAtFreddyBearASSets/
    0-STATIC/  1-MAIN_TEXT/  ...  9-AUDIO/  OTHER_THINGS/
```

El juego también la encuentra si está en la raíz (`FiveNightAtFreddyBearASSets/`).
Funciona incluso abriendo `index.html` con doble clic: los fondos grises y negros de los textos se quitan igual.

## Cómo se juega

**12 AM – 6 AM (Noche 6, IA 15):** funciona como el original, con estos cambios:
- **Freddy**: si estás mirando la **CAM 4B** y cierras la puerta derecha, golpea la puerta (suena a la derecha) y se va al comedor.
- **Foxy**: solo lo frena mirar **Pirate Cove (CAM 1C)**. Si miras otras cámaras, avanza.
- **Cámaras con varios animatrónicos**: se ven todos a la vez (por ejemplo, Bonnie y Freddy juntos en el comedor).

**6 AM – 9 AM (Boss Fight, nivel 30):**
1. Suena la llamada anónima de la Noche 5, aparece Golden Freddy frente a ti, la cámara se sube sola a la 1B
   y Freddy se ríe. La energía se restaura.
2. Bonnie, Chica y Foxy desaparecen. Freddy espera en el escenario mirando fijamente a la cámara.
3. **Ataques de Freddy**: su risa suena a la izquierda o a la derecha. Cierra **esa** puerta antes de que llegue.
   Si estaba cerrada, la golpea y vuelve al escenario. Por la derecha se le ve pasar por 4A y 4B.
4. **Golden Freddy** aparece de la nada en la oficina, pero nunca mientras Freddy está atacando. Si no subes
   la cámara en 4 s, te mata. Con la cámara arriba pulsa **RESETEO DE CÁMARA** (o la tecla X): la cámara queda
   5 s en estática y Golden se va por un buen rato. Si bajas la cámara antes de que termine, el reseteo se cancela.
5. Sobrevive hasta las **9 AM**.

**Vidas:** siempre tienes 3. Si mueres durante el Boss Fight, reintentas desde las 6 AM.
Si se acaban, vuelves al menú y la próxima partida empieza a las 12 AM.

## Controles

| Acción | Ratón / táctil | Teclado |
|---|---|---|
| Mirar por la oficina | ratón a los bordes | ← → |
| Puerta / luz izquierda | botón superior / inferior del panel | Q / A |
| Puerta / luz derecha | botón superior / inferior del panel | E / D |
| Subir/bajar monitor | pasar por la barra de abajo (o tocarla) | Espacio o S |
| Cambiar cámara | clic en el mapa | 1=1A 2=1B 3=1C 4=2A 5=2B 6=3 7=4A 8=4B 9=5 0=6 -=7 |
| Girar la cámara (FNAF Plus) | arrastrar el círculo de la barra superior / rueda | A / D ; R = AUTO/MANUAL |
| Reseteo de cámara (Boss Fight) | botón arriba a la izquierda | X |
| Debug: saltar a 6 AM / a 9 AM | | mantener C + D + `+` |

## Contenido Beta (ON/OFF en el menú)

- Mapa beta del monitor con conos de cámara.
- Grito completo en los jumpscares.
- Imagen sin usar de "todos mirando" en el escenario.

## Ajustes

Al inicio de `game.js` están `CONFIG` (IA, nivel del boss, hora final, vidas, nombre de la carpeta)
y `LAYOUT` (posiciones de puertas, botones, mapa y botón de reseteo).
