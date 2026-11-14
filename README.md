# SECTOR 04: ZONA MUERTA — Adaptación a T3 (UPN)

**Curso:** Computación Gráfica y Visual  
**Evaluación:** T3 — Operación Extracción: videojuego FPS 3D  
**Tecnología:** JavaScript + Three.js r149 + WebGL2  
**Base de trabajo:** archivo `11.zip` compartido previamente.

> **Importante:** esta edición parte de `11.zip`, **no** del posterior paquete con SWAT GUY en tercera persona. No debe sustituir ese paquete sin integrar primero los cambios. Las seis animaciones del protagonista SWAT no se han incorporado a esta base. Las cuatro animaciones del zombi Mixamo sí se conservan.

## Ejecutar el juego

1. Descargar/extráer todo el contenido de la carpeta.
2. Abrir **`index.html`** en Chrome o Edge (funciona sin conexión; WebGL2 debe estar habilitado).
3. Pulsar **JUGAR** y aceptar el control del puntero.

El archivo `Sector-04.html` es una copia autocontenida para abrir sin recursos adicionales. Si el navegador impide la ejecución por política local, servir la carpeta con `python -m http.server 8000` y abrir `http://localhost:8000`.

### Controles

| Control | Acción |
|---|---|
| W, A, S, D | Moverse por el escenario |
| Movimiento del mouse | Mirar alrededor |
| Clic izquierdo | **Un disparo por clic**, sin disparo automático |
| 1 | Rifle de asalto GLB |
| 2 | Escopeta GLB |
| R | Recargar desde la reserva, si hay munición |
| SHIFT | Correr |
| ESPACIO | Saltar |
| Clic derecho | Empujar zombis (no les quita resistencia) |
| ESC | Pausar / liberar el puntero |

## Mecánicas y correspondencia con la rúbrica

| RF | Implementación del proyecto (validación visual pendiente) |
|---|---|
| RF01 | Dos armas distintas con modelos **`assets/rifle_tactico.glb`** y **`assets/escopeta_tactica.glb`**; tecla 1 / tecla 2, un tiro por pulsación. |
| RF02 | Munición independiente por arma. Disparos consumen una unidad, recarga únicamente de reservas finitas. Cajas del mapa reponen ambas reservas. |
| RF03 | Mapa 3D de sectores y pasillos, paredes y pilares, zona de inicio señalizada, objetivo final iluminado. |
| RF04 | Zombie Mixamo original serializado en `assets/zombie_mixamo.glb` (modelo GLB real con geometría, texturas y 69 juntas), decodificado en tiempo de ejecución. Conserva sus poses animadas externas. |
| RF05 | Los enemigos aparecen inactivos y solo se activan dentro de un radio configurable (`DETECTION_RANGE=13` metros); perseguir al jugador usa campo de distancias y comprobación de paredes. |
| RF06 | Cámara de primera persona controlada con mouse, desplazamiento WASD y arma vinculada a la cámara. |
| RF07 | Impactos comprobados con raycasting contra volúmenes de zombis y obstáculos. Cada impacto válido reduce **un punto** y todos los zombis mueren exactamente con el **segundo disparo válido**. Una escopeta con varios perdigones solo descuenta un punto por blanco por clic. |
| RF08 | Recorrido estructurado, sector inicial, oleadas, punto de extracción identificado; mensaje `¡MISIÓN COMPLETADA! Has llegado a la zona de extracción.` al alcanzarlo. |
| RF09 | Contacto físico con un zombi causa `GAME OVER` y detiene inmediatamente la simulación. Botón de reinicio. |
| RF10 | Cajas de munición y suministros repartidas por las habitaciones, recogidas al acercarse. |
| RF11 | Zombis de diferentes velocidades, pasillos, obstáculos, emboscadas y recursos finitos. El equilibrio final se debe comprobar jugando. |
| RF12 | Código fuente, GLB y pruebas incluidos. **Pendiente:** crear el repositorio GitHub del estudiante y grabar un video real de hasta 3 minutos. |

## Arquitectura y archivos

- `game.js` — lógica editable de movimiento, inventario, disparos, detección, persecución, sombras, progreso y renderizado.
- `three.min.js` — Three.js r149, copia local (licencia propia de Three.js).
- `assets/zombie_mixamo.glb` — modelo de zombi en glTF binario (GLB), con texturas incorporadas.
- `assets/rifle_tactico.glb`, `assets/escopeta_tactica.glb` — armas GLB.
- `assets/pose_*.bin` — datos de animaciones Mixamo (quieto, caminar, atacar, morir).
- `assets/zombie_body.webp`, `assets/zombie_detail.webp` — texturas del modelo para el sombreador de GPU.
- `assets/zombie_meta.json` — datos del esqueleto y las animaciones.
- `build.py` — compila el HTML autónomo incorporando modelos GLB, texturas, clips y Three.js.
- `make_glb_assets.py` — regeneración opcional de GLB (requiere `numpy`, `trimesh`, `Pillow`).
- `tests/reglas_t3.test.cjs` — pruebas automatizadas ejecutables con Node.js.

### Compilar y probar

```bash
python build.py
node tests/reglas_t3.test.cjs
```

La edición de `game.js` requiere volver a ejecutar `python build.py`. Los archivos HTML entregados ya están compilados y no requieren Python ni Node para jugar.

## Licencias y recursos

- Modelo 3D **Parasite L Starkie** y clips animados: recursos Mixamo aportados para el proyecto. Verificar los términos de Adobe Mixamo y citar la procedencia en la entrega.
- Modelos del rifle y la escopeta: geometría propia convertida a GLB desde componentes existentes en `11.zip` (no se han descargado nuevas armas comerciales).
- Three.js: paquete de biblioteca incluido con el proyecto (MIT).
- Geometría y texturas del entorno: generación procedural desde el código.

## Checklist antes de entregar

1. **Abrir el juego con WebGL2 real**, observar que zombi y armas GLB se ven correctamente en el navegador del estudiante y sin errores de consola. Estas pruebas no se han podido realizar en la GPU final.
2. Comprobar que un clic equivale a un disparo y mantener presionado no consume munición.
3. Comprobar que dos impactos válidos, incluso de escopeta, eliminan a cada zombi.
4. Comprobar que acercarse sin tocar un zombi no mata y que el contacto sí causa `GAME OVER`.
5. Comprobar que las armas tienen reservas separadas; agotarlas y recuperar munición recogiendo cajas.
6. Recorrer el escenario desde `INICIO` hasta `ZONA DE EXTRACCIÓN` y verificar el mensaje final.
7. **Publicar el contenido del ZIP en GitHub** con este `README.md` y referencias a los recursos usados.
8. **Grabar un video de máximo 3 minutos**: código relevante (disparo, colisiones, IA), ejecución del juego, dos armas GLB, zombis GLB, munición, Game Over, victoria.

## Alcance de las pruebas

Se ha comprobado la **sintaxis JavaScript** del HTML compilado, la lectura estructural de los **tres archivos GLB** y una suite de pruebas aisladas de las reglas de disparo, impactos, extracción y contacto. **No** se ha confirmado todavía el renderizado final en una GPU real ni se ha verificado la ejecución completa en el equipo del estudiante. Por tanto, estos resultados no constituyen una nota ni una certificación de los 20 puntos.
