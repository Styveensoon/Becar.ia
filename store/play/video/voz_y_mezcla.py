"""Voz en off (Dalia, neural es-MX vía edge-tts) + música, mezcladas sobre el video promocional.

Requiere: `pip install edge-tts`, ffmpeg, y antes haber generado `becaria-promo.mp4`
(componer_video.py) y `musica.wav` (musica.py).
Uso: `python store/play/video/voz_y_mezcla.py` -> `becaria-promo-final.mp4`.
"""
import asyncio
import os
import subprocess

import edge_tts

AQUI = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(AQUI, 'tmp')
os.makedirs(TMP, exist_ok=True)

VOZ = 'es-MX-DaliaNeural'
DURACION = 62.3
# (segundo en que empieza, texto). Cada línea arranca justo después de la transición de su escena.
# "Becaria" se escribe sin punto para que no lo lea como "Becar punto ia".
GUION = [
    (0.6, '¿Te enteras de las becas cuando ya cerraron?'),
    (3.1, 'Con Becaria tienes becas, concursos y movilidades, en un solo lugar.'),
    (8.65, 'La app te sugiere oportunidades según tu nivel y lo que te interesa.'),
    (15.8, '¿No sabes por dónde empezar? Tira el dado: fechas, requisitos y beneficios, todo claro.'),
    (23.15, 'Explora por tema...'),
    (27.5, '...o busca justo lo que necesitas, incluso sin internet.'),
    (33.85, 'Guarda tus favoritas con un toque...'),
    (40.8, '...y ve en el calendario cuándo cierra cada una.'),
    (48.35, 'Te avisamos siete, tres y un día antes. Ninguna fecha se te pasa.'),
    (54.5, 'Sin nombre real, sin fotos y sin anuncios.'),
    (58.85, 'Becaria. ¡Descárgala gratis!'),
]


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def duracion(ruta):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ruta],
                         capture_output=True, text=True, check=True)
    return float(out.stdout)


async def sintetizar():
    for i, (_, texto) in enumerate(GUION):
        await edge_tts.Communicate(texto, VOZ, rate='+6%').save(os.path.join(TMP, f'l{i}.mp3'))


def main():
    asyncio.run(sintetizar())
    lineas = []
    for i, (inicio, _) in enumerate(GUION):
        wav = os.path.join(TMP, f'l{i}.wav')
        # Quita el silencio que trae cada mp3 al inicio y al final.
        ffmpeg('-i', os.path.join(TMP, f'l{i}.mp3'), '-af',
               'silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
               'silenceremove=start_periods=1:start_threshold=-45dB,areverse,aresample=48000', wav)
        fin = inicio + duracion(wav)
        siguiente = GUION[i + 1][0] if i + 1 < len(GUION) else DURACION
        assert fin <= siguiente, f'La línea {i} ({fin:.2f} s) se encima con la siguiente ({siguiente} s)'
        lineas.append((inicio, wav))

    args = ['-i', os.path.join(AQUI, 'becaria-promo.mp4'), '-i', os.path.join(AQUI, 'musica.wav')]
    grafo, mezcla = '', ''
    for i, (inicio, wav) in enumerate(lineas):
        args += ['-i', wav]
        ms = int(inicio * 1000)
        grafo += f'[{i + 2}:a]adelay={ms}|{ms}[l{i}];'
        mezcla += f'[l{i}]'
    grafo += (
        f'{mezcla}amix=inputs={len(lineas)}:normalize=0,apad,atrim=0:{DURACION},'
        'highpass=f=90,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,'
        'aformat=channel_layouts=stereo,asplit=2[voz][llave];'
        # Música: menos graves para no tapar la voz, más baja, y se agacha cuando hay voz.
        '[1:a]aresample=48000,bass=g=-5:f=120,volume=0.22[mus];'
        '[mus][llave]sidechaincompress=threshold=0.03:ratio=3:attack=60:release=600:makeup=1[musduck];'
        '[voz][musduck]amix=inputs=2:normalize=0[a]'
    )
    mezcla_wav = os.path.join(TMP, 'mezcla.wav')
    ffmpeg(*args, '-filter_complex', grafo, '-map', '[a]', '-c:a', 'pcm_s16le', mezcla_wav)

    # Normalización lineal a -14 LUFS (lo que usa YouTube). loudnorm en una pasada es dinámico y
    # subía la música en los huecos de la voz; aquí es una ganancia fija más un limitador.
    medida = subprocess.run(['ffmpeg', '-i', mezcla_wav, '-af', 'ebur128', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
    integrado = float(medida.rsplit('I:', 1)[1].split('LUFS')[0])
    ganancia = -14.0 - integrado
    salida = os.path.join(AQUI, 'becaria-promo-final.mp4')
    ffmpeg('-i', os.path.join(AQUI, 'becaria-promo.mp4'), '-i', mezcla_wav, '-map', '0:v', '-map', '1:a',
           '-af', f'volume={ganancia:.2f}dB,alimiter=limit=0.84:attack=2:release=50:level=disabled',
           '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
           '-movflags', '+faststart', salida)
    print(f'{salida} (ganancia {ganancia:+.1f} dB)')


if __name__ == '__main__':
    main()
