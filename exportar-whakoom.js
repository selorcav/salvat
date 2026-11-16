// Ejecutar en la consola del navegador, en el listado de la colección.
// Solo lee fichas del mismo sitio y descarga un CSV local.
(async () => {
  if (location.hostname !== 'www.whakoom.com' || !location.pathname.startsWith('/ediciones/600473/')) {
    alert('Abre primero el listado de la colección Héroes y Villanos en www.whakoom.com.');
    return;
  }
  if (window.whakoomExportacion?.ejecutando) {
    alert('La exportación ya está en curso.');
    return;
  }

  const limpiar = texto => (texto || '').replace(/\s+/g, ' ').trim();
  const etiquetaContenido = /^(?:Contiene|Edici[oó]n\s+original)\s*:\s*/i;
  const fichas = new Map();
  for (const enlace of document.querySelectorAll('a[href*="/comics/"]')) {
    const url = new URL(enlace.href, location.href);
    if (url.origin !== location.origin || !/\/coleccion_heroes_y_villanos\/[^/]+\/?$/.test(url.pathname)) continue;
    const numero = limpiar(enlace.querySelector('.issue-number')?.textContent) || '#' + url.pathname.split('/').filter(Boolean).at(-1);
    const titulo = limpiar(enlace.querySelector('span.title')?.textContent);
    if (!fichas.has(url.pathname) || titulo) fichas.set(url.pathname, { numero, titulo, url: url.href });
  }
  const lista = [...fichas.values()].sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true }));
  if (!lista.length) { alert('No encontré enlaces a los tomos en esta página.'); return; }
  if (!confirm(`Se consultarán ${lista.length} fichas, una por una, con pausas.\nAntes de continuar, verifica que estén todos los tomos cargados en el listado.\nSe usará el primer año mencionado en «Contiene» o «Edición original».`)) return;

  const estado = window.whakoomExportacion = { ejecutando: true, detener: false, filas: [], errores: [] };
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;background:white;color:#111;padding:18px;border:2px solid #1670ba;border-radius:10px;box-shadow:0 4px 20px #0004;font:14px system-ui;max-width:360px';
  const mensaje = document.createElement('p');
  mensaje.style.margin = '0 0 12px';
  const detener = document.createElement('button');
  detener.textContent = 'Detener';
  detener.onclick = () => { estado.detener = true; mensaje.textContent = 'Deteniendo después de la ficha actual…'; };
  const descargar = document.createElement('button');
  descargar.textContent = 'Descargar CSV';
  descargar.style.marginLeft = '10px';
  const descargarCSV = () => {
    const escapar = valor => '"' + String(valor ?? '').replace(/"/g, '""') + '"';
    const cabecera = ['Número', 'Título', 'Año', 'Contenido', 'Personaje', 'Url Whakoom'];
    const csv = '\uFEFF' + [cabecera, ...estado.filas].map(fila => fila.map(escapar).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'coleccion-heroes-y-villanos.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  descargar.onclick = descargarCSV;
  panel.append(mensaje, detener, descargar);
  document.body.append(panel);

  try {
    for (let i = 0; i < lista.length; i++) {
      if (estado.detener) break;
      const ficha = lista[i];
      mensaje.textContent = `Consultando ${i + 1}/${lista.length}: ${ficha.numero} ${ficha.titulo}`;
      const respuesta = await fetch(ficha.url, { credentials: 'same-origin', signal: AbortSignal.timeout(30000) });
      if (!respuesta.ok) throw new Error(`${ficha.numero}: HTTP ${respuesta.status}. Se detuvo la consulta.`);
      const doc = new DOMParser().parseFromString(await respuesta.text(), 'text/html');
      if (/\/login|\/signin/i.test(new URL(respuesta.url).pathname) || /just a moment|you have been blocked|attention required/i.test(doc.title)) {
        throw new Error(`${ficha.numero}: apareció una pantalla de acceso o bloqueo. Se detuvo la consulta.`);
      }
      const candidatos = [...doc.querySelectorAll('p, li, div, section')]
        .map(el => limpiar(el.textContent))
        .filter(texto => etiquetaContenido.test(texto))
        .sort((a, b) => a.length - b.length);
      const original = candidatos[0] || '';
      // Conserva el contenido y retira solo las fechas entre paréntesis.
      const contenido = original.replace(etiquetaContenido, '')
        .replace(/\([^)]*\b(?:18|19|20)\d{2}\b[^)]*\)/g, '')
        .replace(/,?\s*de la edici[oó]n USA\.?\s*$/i, '')
        .replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').trim();
      const anio = original.match(/\b(?:18|19|20)\d{2}\b/)?.[0] || '';
      const titulo = ficha.titulo;
      estado.filas.push([ficha.numero, titulo, anio, contenido, '', ficha.url]);
      if (!contenido || !titulo) estado.errores.push({ numero: ficha.numero, url: ficha.url, motivo: !contenido ? 'No se encontró «Contiene:» ni «Edición original:». Revisar ficha.' : 'No se encontró el título en el listado.' });
      console.log(`[Whakoom] ${ficha.numero}`, { titulo, anio, contenido });
      if (i < lista.length - 1) await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (error) {
    estado.errores.push({ motivo: error.message });
    console.error('[Whakoom]', error);
  } finally {
    estado.ejecutando = false;
    detener.disabled = true;
    mensaje.textContent = `Finalizado: ${estado.filas.length}/${lista.length} tomos. ${estado.errores.length} avisos. Pulsa «Descargar CSV».`;
    if (estado.errores.length) console.table(estado.errores);
  }
})();
