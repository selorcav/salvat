# Estado del trabajo

## Web: primera vista creada
- Diseño adaptado al PDF local `F0_Heroes-y-villanos.pdf`: fondo azul marino con trama de puntos, azul DC, etiquetas rojas, títulos blancos condensados y marca superior blanca. Cabecera compacta usa ilustración extraída de primera página en `web/dist/assets/heroes-villanos.jpg`. Modal y controles adaptados a tema oscuro, misma funcionalidad. Se conserva línea alternada. Recursos y sintaxis verificados; sin revisión visual en navegador.
- Cabecera compactada: marca de 56px, título reducido, sin eslogan redundante. Barra de orden/periodos/personajes horizontal en escritorio, dos filas en tablet y apilada en móvil. Contador debajo, menos margen antes de las portadas. HTML validado; controles e IDs conservados.
- Animaciones: entrada escalonada de cabecera, aparición de portadas al entrar en pantalla con IntersectionObserver, fundido al filtrar/ordenar, modal con entrada/salida y transición al navegar relacionados. Hover en portadas/botones/chips. Respeta prefers-reduced-motion (también cancela al cambiar preferencia). Verificadas rutas con/sin movimiento, Escape, filtro y orden en DOM simulado; apariencia pendiente de revisión en navegador del usuario.
- Desplegable de personajes superior generado desde Personaje (separado por comas), con Todos los personajes. Chips de personajes en modal filtran y cierran la modal, sincronizan selector y enfocan el filtro. Se combinan por intersección con periodo y conservan orden; contador y mensaje sin resultados. Verificados todos los personajes, chips, combinación con periodo/orden y reinicio a 80 tomos.
- Filtro superior de periodos generado desde los datos, con opción Todos, estado activo y contador. Chips de Periodo en modales son botones: cierran modal, filtran, enfocan filtro superior y desplazan hasta él. Filtrar conserva orden por número/fecha; ordenar conserva filtro. Personajes siguen como chips sin acción por ahora. Verificados todos los periodos, contador, filtro desde modal, orden combinado y retorno a 80 tomos con DOM simulado.
- Modales añadidas por petición posterior: cada tomo abre un dialog nativo con año de publicación, contenido, periodo, personaje y saga/evento. La portada enlaza a Url Whakoom en pestaña nueva. Relacionados por intersección de etiquetas Saga/evento separadas por coma, sin duplicados ni el tomo abierto; sección oculta si no hay. Los relacionados abren sus detalles en la misma modal. Cierre por botón, Escape y fondo, bloqueo de scroll. Verificado con DOM simulado; sin revisión visual en navegador.
- Dos botones superiores permiten ordenar por número de tomo (inicial) o fecha de publicación (columna Año, ascendente; empate por número). En modo fecha se muestra el año junto a cada título. Sin fechas completas: se usa exclusivamente Año de la planilla. Funciona al abrir index.html directamente. Verificados los dos botones con DOM simulado y los 80 registros.
- Actualización: se puede abrir `web/dist/index.html` directamente con doble clic, sin servidor ni Python. `datos.js` es una copia completa del JSON cargada con script clásico; `app.js` ya no usa fetch. Mantener datos.js y tomos.json sincronizados al actualizar los datos. Sintaxis y coincidencia de los 80 registros verificadas.
- Fuente vigente: `Salvat (1).xlsx`, 80 tomos, columnas Número, Título, Contenido, Año, Saga/evento, Periodo, Personaje y Url Whakoom.
- `tomos.json` en la raíz conserva los datos de la planilla.
- Web estática en `web/dist/`: línea central y portadas alternadas (impares derecha, pares izquierda), número y título. En móvil, una columna. Sin modales por petición del usuario; se añadirán en futuras iteraciones.
- `web/dist/tomos.json` conserva las ocho columnas y añade `portada`. Tiene las 80 imágenes locales vinculadas por número desde `portadas/portadas.json`.
- Abrir con `python -m http.server 8000 --directory web/dist`, desde webcomics, y visitar http://localhost:8000.
- JavaScript validado y recursos comprobados por HTTP, incluyendo las 80 portadas y orden 1-80. Sin revisión visual con navegador disponible.
- Sites registrado como `appgprj_6afa696fe7f48191af21a34deed9dd12`, slug `heroes-villanos-salvat`. Identidad guardada en `web/.openai/hosting.json`. Publicación pendiente: site-workflow falló por conexión a git.chatgpt-team.site:443. No hay URL publicada verificada. Reutilizar este ID al reintentar y solicitar credencial nueva si hace falta.

## Objetivo
Exportar los 80 tomos de la colección Héroes y Villanos de Whakoom a un CSV para importar en Google Sheets.

- Colección: https://www.whakoom.com/ediciones/600473/coleccion_heroes_y_villanos-cartone/todos
- Planilla destino: https://docs.google.com/spreadsheets/d/1m8dBDfgeDlowA9YeYaLcLHh4r0BvQnk08wE9-s3PXRM/edit
- Idioma de comunicación: español.

## Archivo vigente
`exportar-whakoom.js`, dentro de esta carpeta. Su sintaxis fue verificada con `node --check exportar-whakoom.js` después del último cambio.

El usuario lo ejecuta en la consola de su navegador desde el listado de la colección, con su sesión iniciada y todos los tomos cargados. Consulta las fichas de forma secuencial con pausas de 1,5 segundos y ofrece un botón para descargar el CSV. Se detiene ante errores HTTP o pantallas de bloqueo reconocidas. Conserva resultados parciales en `window.whakoomExportacion` y muestra avisos en consola.

## Columnas del CSV
1. Número: del listado.
2. Título: del listado.
3. Año: primer año mencionado en el bloque del contenido; vacío si no se encuentra. El ejemplo del usuario toma 2016 del contenido original de Batman, no el año de la edición española.
4. Contenido: reconoce tanto «Contiene:» como «EDICIÓN ORIGINAL:», sin distinguir mayúsculas y con o sin tilde en edición. Quita el prefijo, las fechas entre paréntesis y el sufijo «de la edición USA».
5. Personaje: vacío para que lo complete el usuario.
6. Url Whakoom: enlace real de cada tomo, obtenido del listado. Este fue el último cambio solicitado y ya está implementado.

Los códigos internos de las URLs cambian entre tomos; no se deben fabricar enlaces cambiando solo el número final. Ejemplo del primer tomo: https://www.whakoom.com/comics/jpGR0/coleccion_heroes_y_villanos/1

## Acceso y limitaciones
- La consulta web directa a Whakoom devolvió 403.
- El usuario también encontró una pantalla de bloqueo de seguridad en el navegador de TinyFish. No se confirmó si el acceso inicial fallaba por login; el bloqueo de TinyFish ocurre antes de iniciar sesión.
- Se sugirieron Google Drive y TinyFish, pero no hay confirmación de conexión utilizable. La consulta a sesiones de documento no encontró sesiones conectadas.
- No se ha editado la planilla directamente.
- Se inspeccionó un HTML guardado por el usuario en el Escritorio. Contenía 80 enlaces, títulos y números, pero no contenido de las fichas. Sus recursos incluían referencias al servicio `/pwkws.asmx/EditionComicsPage`. En una consulta posterior el HTML ya no estaba en esa ubicación.
- El script está validado sintácticamente; no se ha probado de extremo a extremo desde las herramientas del asistente contra Whakoom. El usuario indicó que ya podía descargar un CSV.

## Importación en Sheets
Archivo > Importar > Subir > seleccionar CSV > Insertar hojas nuevas > separador Coma. Para llevar los datos a su hoja con formato, copiar sin encabezado y pegar solo valores desde A2, reemplazando el ejemplo existente para no duplicar el tomo #1.

## Tema pendiente opcional
El usuario preguntó cómo descargar las 80 portadas. Se explicó la posibilidad de extraer enlaces y descargarlas, pero no se implementó nada para imágenes. Antes de hacerlo, comprobar miniaturas frente a imágenes de mayor resolución y acceso al servidor de imágenes.

## Última solicitud
El usuario pidió cerrar y guardar el contexto. Este archivo resume el estado para continuar en otra conversación. El script actualizado queda guardado en la misma carpeta.

## Portadas: scripts creados el 15/11/2026
- `extraer-portadas-whakoom.js`: ejecutar en la consola del navegador con todos los tomos cargados. Consulta fichas secuencialmente y extrae imágenes de metadatos og:image/twitter:image/image_src; descarga `portadas-whakoom.json`. Estado parcial en `window.whakoomPortadas`.
- `descargar-portadas.py`: ejecutar `python descargar-portadas.py portadas-whakoom.json`. Descarga a `portadas/`, genera `portadas/portadas.json` con la relación título/archivo y `portadas-heroes-y-villanos.zip`.
- Los archivos usan el título, sustituyendo caracteres incompatibles con Windows. Desambigua títulos repetidos con el número de tomo. Conserva los títulos originales en el índice JSON para la futura web.
- Verificada sintaxis JavaScript/Python y funciones de nombres/formato de imagen. Pendiente probar con el navegador del usuario: aún no se ha confirmado la resolución ni que los metadatos de las fichas correspondan a las portadas esperadas. No se inventan URLs de imágenes de mayor tamaño.
