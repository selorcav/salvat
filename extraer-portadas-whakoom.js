// Pegar en la consola del navegador con los 80 tomos cargados en el listado.
// Descarga un manifiesto; descargar-portadas.py descarga después las imágenes.
(async () => {
  if (location.hostname !== 'www.whakoom.com' || !location.pathname.startsWith('/ediciones/600473/')) {
    alert('Abre el listado de Héroes y Villanos en Whakoom.'); return;
  }
  if (window.whakoomPortadas?.ejecutando) return;
  const limpiar = s => (s || '').replace(/\s+/g, ' ').trim();
  const fichas = new Map();
  for (const a of document.querySelectorAll('a[href*="/comics/"]')) {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\/coleccion_heroes_y_villanos\/[^/]+\/?$/.test(url.pathname)) continue;
    const titulo = limpiar(a.querySelector('span.title')?.textContent);
    if (!fichas.has(url.pathname) || titulo) fichas.set(url.pathname, {
      numero: limpiar(a.querySelector('.issue-number')?.textContent) || url.pathname.split('/').filter(Boolean).at(-1),
      titulo, url: url.href
    });
  }
  const lista = [...fichas.values()].sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true }));
  if (!lista.length) { alert('No se encontraron tomos.'); return; }
  const estado = window.whakoomPortadas = { ejecutando: true, detener: false, portadas: [], errores: [], total: lista.length };
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:2147483647;background:white;color:#111;padding:18px;border:2px solid #1670ba;border-radius:10px;font:14px system-ui;max-width:420px';
  const mensaje = document.createElement('p');
  const parar = document.createElement('button'); parar.textContent = 'Detener';
  parar.onclick = () => { estado.detener = true; };
  const guardar = document.createElement('button'); guardar.textContent = 'Descargar manifiesto';
  guardar.onclick = () => {
    const blob = new Blob([JSON.stringify({ total: estado.total, portadas: estado.portadas, errores: estado.errores }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'portadas-whakoom.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  panel.append(mensaje, parar, guardar); document.body.append(panel);
  try {
    for (const [i, ficha] of lista.entries()) {
      if (estado.detener) break;
      mensaje.textContent = `${i + 1}/${lista.length}: ${ficha.titulo || ficha.numero}`;
      const r = await fetch(ficha.url, { credentials: 'same-origin', signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${ficha.numero}.`);
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      if (/\/login|\/signin/i.test(new URL(r.url).pathname) || /just a moment|you have been blocked|attention required/i.test(doc.title)) throw new Error('Apareció una pantalla de acceso o bloqueo.');
      // La imagen social de la ficha suele ser la portada completa. No se inventan rutas de mayor resolución.
      const candidatos = [...doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"], link[rel="image_src"]')]
        .map(el => el.getAttribute('content') || el.getAttribute('href'));
      const portada = candidatos.map(s => { try { return new URL(s, r.url); } catch { return null; } })
        .find(u => u && /^https?:$/.test(u.protocol));
      if (!ficha.titulo || !portada) estado.errores.push({ ...ficha, motivo: !ficha.titulo ? 'Falta título en el listado.' : 'No se encontró imagen principal; revisar ficha.' });
      else estado.portadas.push({ ...ficha, portada: portada.href });
      if (i < lista.length - 1) await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (e) { estado.errores.push({ motivo: e.message }); console.error(e); }
  finally {
    estado.ejecutando = false; parar.disabled = true;
    mensaje.textContent = `Extraídas ${estado.portadas.length}/${lista.length} portadas. ${estado.errores.length} avisos. Descarga el manifiesto.`;
    if (estado.errores.length) console.table(estado.errores);
  }
})();
