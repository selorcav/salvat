'use strict';
(async () => {
  const timeline = document.querySelector('#timeline');
  const status = document.querySelector('#status');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animar = (elemento, fotogramas, opciones = {}) => {
    if (movimientoReducido.matches || !elemento?.animate) return null;
    // Cancelar la transición anterior evita acumular animaciones al pulsar rápido.
    elemento.getAnimations().forEach(animacion => animacion.cancel());
    return elemento.animate(fotogramas, { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', ...opciones });
  };
  const revelar = elemento => animar(elemento, [
    { opacity: 0, transform: 'translateY(22px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 560 });
  const observador = 'IntersectionObserver' in window ? new IntersectionObserver(entradas => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      revelar(entrada.target);
      observador.unobserve(entrada.target);
    }
  }, { threshold: 0.08 }) : null;
  movimientoReducido.addEventListener('change', () => {
    if (movimientoReducido.matches) document.getAnimations().forEach(animacion => animacion.cancel());
  });
  try {
    if (!Array.isArray(window.tomosColeccion)) throw new Error('No se pudo cargar la colección.');
    const tomos = [...window.tomosColeccion];
    let ordenActual = 'numero';
    let periodoActual = '';
    let personajeActual = '';
    const periodo = tomo => String(tomo['Periodo'] || '').trim();
    const personajesDe = tomo => [...new Set(String(tomo['Personaje'] || '').split(',').map(s => s.trim()).filter(Boolean))];
    const selectorPersonaje = document.querySelector('#character-select');
    const personajesDisponibles = [...new Set(tomos.flatMap(personajesDe))].sort((a, b) => a.localeCompare(b, 'es'));
    for (const personaje of personajesDisponibles) {
      const option = document.createElement('option'); option.value = personaje; option.textContent = personaje;
      selectorPersonaje.append(option);
    }
    const aplicarPersonaje = valor => {
      personajeActual = valor;
      selectorPersonaje.value = valor;
      if (modal.open) modal.close();
      renderizar(ordenActual);
    };
    selectorPersonaje.addEventListener('change', () => aplicarPersonaje(selectorPersonaje.value));
    const filtrosPeriodo = document.querySelector('#period-filters');
    const botonesPeriodo = [];
    const aplicarPeriodo = valor => {
      periodoActual = valor;
      if (modal.open) modal.close();
      renderizar(ordenActual);
    };
    const ordenPeriodos = ['Pre-Crisis', 'Post-Crisis', 'The New52', 'Rebirth'];
    const posicionPeriodo = valor => {
      const index = ordenPeriodos.indexOf(valor);
      return index === -1 ? ordenPeriodos.length : index;
    };
    const periodos = [...new Set(tomos.map(periodo).filter(Boolean))]
      .sort((a, b) => posicionPeriodo(a) - posicionPeriodo(b) || a.localeCompare(b, 'es'));
    for (const valor of ['', ...periodos]) {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'character-chip period-option'; button.dataset.periodo = valor;
      button.textContent = valor || 'Todos';
      button.setAttribute('aria-pressed', String(!valor));
      button.addEventListener('click', () => aplicarPeriodo(valor));
      filtrosPeriodo.append(button); botonesPeriodo.push(button);
    }
    const numero = tomo => Number(String(tomo['Número']).replace(/\D/g, ''));
    const anio = tomo => {
      const value = Number(tomo['Año']);
      return Number.isFinite(value) && value > 0 ? value : Infinity;
    };
    const modal = document.querySelector('#tomo-modal');
    const closeButton = modal.querySelector('.modal-close');
    const grupos = tomo => String(tomo['Saga/evento'] || '').split(',')
      .map(s => s.trim().toLocaleLowerCase('es')).filter(Boolean);
    const relacionados = tomo => {
      const propios = new Set(grupos(tomo));
      return tomos.filter(otro => numero(otro) !== numero(tomo) && grupos(otro).some(g => propios.has(g)))
        .sort((a, b) => numero(a) - numero(b));
    };
    const abrirModal = tomo => {
      const estabaAbierta = modal.open;
      modal.getAnimations().forEach(animacion => animacion.cancel());
      const cover = document.querySelector('#modal-cover');
      cover.src = tomo.portada; cover.alt = `Portada de ${tomo['Título']}`;
      document.querySelector('#modal-link').href = tomo['Url Whakoom'];
      document.querySelector('#modal-number').textContent = `TOMO ${String(numero(tomo)).padStart(2, '0')}`;
      document.querySelector('#modal-title').textContent = tomo['Título'];
      const fields = document.querySelector('#modal-fields');
      fields.replaceChildren();
      for (const [label, value] of [
        ['Año de publicación', Number.isFinite(anio(tomo)) ? String(anio(tomo)) : 'No disponible'],
        ['Contenido', tomo['Contenido']], ['Periodo', tomo['Periodo']]
      ]) {
        if (!value) continue;
        const row = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = label;
        const dd = document.createElement('dd');
        if (label === 'Periodo') {
          dd.className = 'character-chips';
          const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'character-chip period-option';
          chip.textContent = value; chip.dataset.periodo = String(value).trim();
          chip.setAttribute('aria-label', `Filtrar por periodo: ${value}`);
          chip.addEventListener('click', () => {
            aplicarPeriodo(String(value).trim());
            const button = botonesPeriodo.find(b => b.dataset.periodo === periodoActual);
            button?.focus({ preventScroll: true });
            document.querySelector('.period-filter').scrollIntoView({ block: 'start', behavior: 'instant' });
          });
          dd.append(chip);
        } else {
          dd.textContent = value;
        }
        row.append(dt, dd); fields.append(row);
      }
      const personajes = personajesDe(tomo);
      if (personajes.length) {
        const row = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = 'Personajes';
        const dd = document.createElement('dd'); dd.className = 'character-chips';
        for (const personaje of personajes) {
          const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'character-chip period-option';
          chip.textContent = personaje; chip.dataset.personaje = personaje;
          chip.setAttribute('aria-label', `Filtrar por personaje: ${personaje}`);
          chip.addEventListener('click', () => {
            aplicarPersonaje(personaje);
            selectorPersonaje.focus({ preventScroll: true });
            document.querySelector('.character-filter').scrollIntoView({ block: 'center', behavior: 'instant' });
          });
          dd.append(chip);
        }
        row.append(dt, dd); fields.append(row);
      }
      const related = relacionados(tomo);
      document.querySelector('#modal-related').hidden = !related.length;
      const list = document.querySelector('#related-list'); list.replaceChildren();
      for (const otro of related) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'related-card';
        const image = document.createElement('img'); image.src = otro.portada; image.alt = ''; image.loading = 'lazy';
        const label = document.createElement('span'); label.textContent = `${otro['Número']} · ${otro['Título']}`;
        button.append(image, label); button.addEventListener('click', () => abrirModal(otro)); list.append(button);
      }
      if (!modal.open) modal.showModal();
      animar(modal.querySelector('.modal-shell'), [
        { opacity: 0, transform: estabaAbierta ? 'translateX(12px)' : 'translateY(22px) scale(.98)' },
        { opacity: 1, transform: 'translate(0) scale(1)' }
      ], { duration: 360 });
      document.body.classList.add('modal-open');
      modal.scrollTop = 0;
      closeButton.focus({ preventScroll: true });
    };
    let cerrando = false;
    const cerrarModal = () => {
      if (cerrando || !modal.open) return;
      const animacion = animar(modal, [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(12px) scale(.985)' }
      ], { duration: 160, easing: 'ease-in' });
      if (!animacion) { modal.close(); return; }
      cerrando = true;
      animacion.finished.then(() => modal.close()).catch(() => {}).finally(() => { cerrando = false; });
    };
    closeButton.addEventListener('click', cerrarModal);
    modal.addEventListener('cancel', event => { event.preventDefault(); cerrarModal(); });
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
    modal.addEventListener('click', event => {
      const rect = modal.getBoundingClientRect();
      if (event.target === modal && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) cerrarModal();
    });
    const renderizar = orden => {
    ordenActual = orden;
    tomos.sort((a, b) => orden === 'fecha'
      ? (anio(a) - anio(b)) || numero(a) - numero(b)
      : numero(a) - numero(b));
    const fragment = document.createDocumentFragment();
    const visibles = tomos.filter(tomo => (!periodoActual || periodo(tomo) === periodoActual)
      && (!personajeActual || personajesDe(tomo).includes(personajeActual)));
    for (const [index, tomo] of visibles.entries()) {
      const li = document.createElement('li'); li.className = 'tomo';
      li.id = `tomo-${numero(tomo)}`;
      const article = document.createElement('button'); article.className = 'card'; article.type = 'button';
      article.setAttribute('aria-label', `Ver detalles de ${tomo['Título']}, tomo ${numero(tomo)}`);
      article.setAttribute('aria-haspopup', 'dialog');
      article.addEventListener('click', () => abrirModal(tomo));
      const wrap = document.createElement('div'); wrap.className = 'cover-wrap';
      const img = document.createElement('img'); img.className = 'cover';
      img.src = tomo.portada; img.alt = `Portada de ${tomo['Título']}`;
      img.width = 155; img.height = 232; img.loading = index < 4 ? 'eager' : 'lazy'; img.decoding = 'async';
      img.addEventListener('error', () => {
        const fallback = document.createElement('div'); fallback.className = 'missing';
        fallback.textContent = tomo['Título']; wrap.replaceChildren(fallback);
      }, { once: true });
      wrap.append(img);
      const details = document.createElement('div'); details.className = 'details';
      const number = document.createElement('p'); number.className = 'number';
      number.textContent = `TOMO ${String(numero(tomo)).padStart(2, '0')}`;
      const title = document.createElement('span'); title.className = 'title'; title.textContent = tomo['Título'];
      const year = document.createElement('p'); year.className = 'year';
      year.textContent = Number.isFinite(anio(tomo)) ? String(anio(tomo)) : 'Sin año';
      year.hidden = orden !== 'fecha';
      details.append(number, title, year); article.append(wrap, details); li.append(article); fragment.append(li);
    }
    observador?.disconnect();
    timeline.replaceChildren(fragment);
    animar(timeline, [{ opacity: .35 }, { opacity: 1 }], { duration: 240 });
    if (observador && !movimientoReducido.matches) {
      for (const card of timeline.querySelectorAll('.card')) observador.observe(card);
    }
    status.hidden = visibles.length > 0;
    status.textContent = 'No hay tomos para esta combinación. Prueba otro periodo o personaje.';
    document.querySelector('.collection').setAttribute('aria-label', orden === 'fecha' ? 'Tomos por año de publicación' : 'Tomos en orden de colección');
    document.querySelector('#sort-description').textContent = orden === 'fecha'
      ? 'Del más antiguo al más reciente, según el año de publicación.'
      : 'Ordenados por número de tomo, de menor a mayor.';
    document.querySelector('#filter-summary').textContent = [
      `${visibles.length} ${visibles.length === 1 ? 'tomo' : 'tomos'}`,
      periodoActual || 'Todos los periodos', personajeActual || 'Todos los personajes'
    ].join(' · ');
    for (const button of botonesPeriodo) {
      button.setAttribute('aria-pressed', String(button.dataset.periodo === periodoActual));
    }
    for (const button of document.querySelectorAll('[data-sort]')) {
      button.setAttribute('aria-pressed', String(button.dataset.sort === orden));
    }
    };
    for (const button of document.querySelectorAll('[data-sort]')) {
      button.addEventListener('click', () => renderizar(button.dataset.sort));
    }
    renderizar('numero');
  } catch (error) { status.textContent = `${error.message} Recarga la página para volver a intentar.`; }
})();
