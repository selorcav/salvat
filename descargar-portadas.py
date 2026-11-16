"""Uso: python descargar-portadas.py portadas-whakoom.json
Solo usa la biblioteca estándar. Conserva el título original en portadas.json.
"""
import argparse
import json
import re
import time
import urllib.request
import zipfile
from pathlib import Path


def nombre_seguro(titulo):
    nombre = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', titulo).strip().rstrip('. ')
    if re.fullmatch(r'CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9]', nombre.split('.')[0], re.I):
        nombre = '_' + nombre
    return nombre[:160].rstrip('. ') or 'Sin título'


def extension(datos):
    if datos.startswith(b'\xff\xd8\xff'): return '.jpg'
    if datos.startswith(b'\x89PNG\r\n\x1a\n'): return '.png'
    if datos[:6] in (b'GIF87a', b'GIF89a'): return '.gif'
    if datos[:4] == b'RIFF' and datos[8:12] == b'WEBP': return '.webp'
    if datos[4:8] == b'ftyp' and datos[8:12] in (b'avif', b'avis'): return '.avif'
    raise ValueError('La respuesta no es una imagen reconocida; podría ser un bloqueo.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifiesto', type=Path)
    args = parser.parse_args()
    manifiesto = json.loads(args.manifiesto.read_text(encoding='utf-8-sig'))
    destino = args.manifiesto.resolve().parent / 'portadas'
    destino.mkdir(exist_ok=True)
    usados = set()
    resultados, errores = [], list(manifiesto.get('errores', []))
    for ficha in manifiesto['portadas']:
        base = nombre_seguro(ficha['titulo'])
        nombre = base
        indice = 1
        while nombre.casefold() in usados:
            indice += 1
            nombre = f"{base} - tomo {nombre_seguro(str(ficha['numero']))} ({indice})"
        usados.add(nombre.casefold())
        try:
            peticion = urllib.request.Request(ficha['portada'], headers={
                'User-Agent': 'Mozilla/5.0', 'Referer': ficha['url']})
            with urllib.request.urlopen(peticion, timeout=40) as respuesta:
                datos = respuesta.read()
            archivo = nombre + extension(datos)
            ruta = destino / archivo
            if ruta.exists() and ruta.read_bytes() != datos:
                raise ValueError(f'Ya existe un archivo distinto: {archivo}. No se sobrescribió.')
            ruta.write_bytes(datos)
            resultados.append({**ficha, 'archivo': archivo})
            print(f"OK: {archivo}")
        except Exception as error:
            errores.append({**ficha, 'motivo': str(error)})
            print(f"ERROR: {ficha['titulo']}: {error}")
        time.sleep(1.5)
    indice = destino / 'portadas.json'
    indice.write_text(json.dumps({'total': manifiesto.get('total'), 'portadas': resultados, 'errores': errores}, ensure_ascii=False, indent=2), encoding='utf-8')
    zip_path = destino.parent / 'portadas-heroes-y-villanos.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as paquete:
        paquete.write(indice, 'portadas/portadas.json')
        for fila in resultados:
            paquete.write(destino / fila['archivo'], 'portadas/' + fila['archivo'])
    print(f'\nDescargadas: {len(resultados)}. Avisos: {len(errores)}. ZIP: {zip_path}')


if __name__ == '__main__':
    main()
