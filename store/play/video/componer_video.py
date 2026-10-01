"""Video promocional de Play Store (1920x1080, 30 fps) a partir de grabaciones reales del emulador.

Las grabaciones crudas van en `fuente/` (adb screenrecord 720x1608, barra de estado en modo demo).
Uso: `python store/play/video/componer_video.py` desde la raíz del repo. Requiere Pillow y ffmpeg.
Resultado: `store/play/video/becaria-promo.mp4` (sin música: agrégala en YouTube Studio).
"""
import os
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
FUENTE = os.path.join(AQUI, 'fuente')
TMP = os.path.join(AQUI, 'tmp')
FONTS = os.path.join(REPO, 'node_modules', '@expo-google-fonts', 'poppins')
os.makedirs(TMP, exist_ok=True)

W, H, FPS = 1920, 1080, 30
NAVY = (43, 45, 66)
PRIMARY = (255, 122, 51)
PRIMARY_TEXT = (194, 74, 15)
ACCENT = (255, 193, 69)
CLARO = dict(texto=NAVY, resalte=PRIMARY_TEXT, sub=(92, 94, 116), aro=NAVY)
OSCURO = dict(texto=(255, 255, 255), resalte=ACCENT, sub=(201, 202, 214), aro=(255, 255, 255))

# Teléfono: pantalla de 430x960 (proporción de la grabación 720x1608) con bisel.
SW, SH = 430, 960
BISEL, RADIO = 14, 46
PW, PH = SW + 2 * BISEL, SH + 2 * BISEL
PX, PY = 1210, (H - PH) // 2
TRANSICION = 0.45


def font(peso, tam):
    nombre = {'regular': '400Regular/Poppins_400Regular', 'semibold': '600SemiBold/Poppins_600SemiBold',
              'bold': '700Bold/Poppins_700Bold'}[peso]
    return ImageFont.truetype(os.path.join(FONTS, nombre + '.ttf'), tam)


TITULO, SUB = font('bold', 78), font('regular', 38)

# (grabación, inicio, fin, fondo, círculo, tema, título [(texto, resaltado)], subtítulo, ¿tapar barra de estado?)
ESCENAS = [
    ('e1.mp4', 0.0, 6.0, (255, 231, 214), (255, 214, 186), CLARO,
     [('Becas y más, ', 0), ('en un solo lugar', 1)],
     'Becas, concursos, movilidades y certificaciones para estudiantes', False),
    ('e2.mp4', 0.0, 7.6, (255, 240, 199), (255, 226, 150), CLARO,
     [('Sugerencias ', 0), ('hechas para ti', 1)],
     'Según tu nivel educativo y lo que te interesa', True),
    ('e3.mp4', 0.8, 8.6, NAVY, (58, 61, 88), OSCURO,
     [('¿No sabes por dónde empezar? ', 0), ('Tira el dado', 1)],
     'Y ve toda la info: fechas, requisitos y beneficios', True),
    ('e4.mp4', 0.8, 5.6, (220, 234, 247), (196, 218, 240), CLARO,
     [('Explora ', 0), ('por tema', 1)],
     'IA, robótica, negocios, arte, salud, idiomas y más', True),
    ('e5.mp4', 0.6, 7.4, (220, 241, 227), (194, 228, 205), CLARO,
     [('Encuentra justo ', 0), ('lo que buscas', 1)],
     'Búsqueda rápida, incluso sin internet', True),
    ('e6.mp4', 0.8, 8.2, (253, 227, 234), (250, 204, 216), CLARO,
     [('Guarda las que ', 0), ('te laten', 1)],
     'Un toque al corazón y quedan en tus favoritas', True),
    ('e7.mp4', 0.8, 8.8, NAVY, (58, 61, 88), OSCURO,
     [('Tus fechas límite, ', 0), ('de un vistazo', 1)],
     'Un punto de color marca cada cierre', True),
    ('e8.mp4', 0.0, 6.6, (255, 240, 199), (255, 226, 150), CLARO,
     [('Te avisamos ', 0), ('antes de que cierre', 1)],
     'Recordatorios 7, 3 y 1 día antes de cada fecha límite', True),
    ('e9.mp4', 0.8, 5.6, (255, 231, 214), (255, 214, 186), CLARO,
     [('Tu perfil, ', 0), ('tu estilo', 1)],
     'Sin nombre real, sin fotos y sin anuncios', True),
]


def envolver_rico(segmentos, fuente, ancho):
    palabras = [(p, res) for texto, res in segmentos for p in texto.split(' ') if p]
    lineas, actual = [], []
    for p in palabras:
        if actual and fuente.getlength(' '.join(w for w, _ in actual + [p])) > ancho:
            lineas.append(actual)
            actual = [p]
        else:
            actual.append(p)
    return lineas + [actual]


def envolver(texto, fuente, ancho):
    lineas, actual = [], ''
    for p in texto.split(' '):
        prueba = (actual + ' ' + p).strip()
        if actual and fuente.getlength(prueba) > ancho:
            lineas.append(actual)
            actual = p
        else:
            actual = prueba
    return lineas + [actual]


def wordmark(d, x, y, tam, anchor='lm'):
    f = font('bold', tam)
    total = f.getlength('Becar.ia')
    if anchor == 'mm':
        x -= total / 2
    for pieza, color in (('Becar', NAVY), ('.', PRIMARY), ('ia', NAVY)):
        d.text((x, y), pieza, font=f, fill=color, anchor='lm')
        x += f.getlength(pieza)


def fondo_escena(n, fondo, circulo, tema, titulo, sub):
    im = Image.new('RGBA', (W, H), fondo + (255,))
    d = ImageDraw.Draw(im)
    cx, cy = PX + PW // 2, H // 2
    d.ellipse((cx - 470, cy - 470, cx + 470, cy + 470), fill=circulo)
    d.ellipse((1060, 170, 1100, 210), fill=ACCENT)
    d.rounded_rectangle((1790, 230, 1838, 278), 14, fill=PRIMARY)
    d.ellipse((1760, 860, 1800, 900), outline=tema['aro'], width=8)
    # Sombra del teléfono
    sombra = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle((PX, PY + 28, PX + PW, PY + PH + 28), RADIO + BISEL,
                                             fill=(20, 22, 40, 80))
    im.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(36)))
    # Texto a la izquierda, centrado en vertical
    x0, ancho = 150, 880
    lineas = envolver_rico(titulo, TITULO, ancho)
    subs = envolver(sub, SUB, ancho - 60)
    alto = len(lineas) * 96 + 30 + len(subs) * 56
    y = (H - alto) // 2
    for linea in lineas:
        x = x0
        for i, (w, res) in enumerate(linea):
            pieza = w + (' ' if i < len(linea) - 1 else '')
            d.text((x, y), pieza, font=TITULO, fill=tema['resalte'] if res else tema['texto'])
            x += TITULO.getlength(pieza)
        y += 96
    y += 30
    for s in subs:
        d.text((x0, y), s, font=SUB, fill=tema['sub'])
        y += 56
    # Barrita de marca arriba a la izquierda
    logo = Image.open(os.path.join(REPO, 'assets', 'brand', 'logo.png'))
    logo = logo.resize((round(logo.width * 64 / logo.height), 64), Image.LANCZOS)
    im.alpha_composite(logo, (x0, 70))
    f = font('bold', 36)
    xm = x0 + logo.width + 14
    for pieza, color in (('Becar', tema['texto']), ('.', PRIMARY), ('ia', tema['texto'])):
        d.text((xm, 70 + 32), pieza, font=f, fill=color, anchor='lm')
        xm += f.getlength(pieza)
    ruta = os.path.join(TMP, f'fondo{n}.png')
    im.convert('RGB').save(ruta)
    return ruta


def capas_telefono():
    """Bisel (con la pantalla transparente) y máscara redondeada de la pantalla."""
    bisel = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    d = ImageDraw.Draw(bisel)
    d.rounded_rectangle((0, 0, PW - 1, PH - 1), RADIO + BISEL, fill=(24, 25, 38, 255))
    d.rounded_rectangle((BISEL, BISEL, BISEL + SW - 1, BISEL + SH - 1), RADIO, fill=(0, 0, 0, 0))
    cx = PW // 2
    d.ellipse((cx - 8, BISEL + 12, cx + 8, BISEL + 28), fill=(24, 25, 38, 255))
    bisel.save(os.path.join(TMP, 'bisel.png'))
    mascara = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, SW - 1, SH - 1), RADIO, fill=255)
    mascara.save(os.path.join(TMP, 'mascara.png'))
    # Barra de estado limpia (9:41) para tapar contenido que pasa por debajo al hacer scroll.
    banda = Image.open(os.path.join(AQUI, '..', 'fuente', 'c_fav.png')).convert('RGB').crop((0, 0, 1280, 140))
    banda.resize((SW, round(140 * SW / 1280)), Image.LANCZOS).save(os.path.join(TMP, 'banda.png'))


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def render_escena(n, escena):
    archivo, ini, fin, fondo, circulo, tema, titulo, sub, banda = escena
    dur = fin - ini
    bg = fondo_escena(n, fondo, circulo, tema, titulo, sub)
    # La grabación es de cuadros variables y termina en el último cambio: se fija a 30 fps y se
    # congela el último cuadro hasta completar la duración.
    pantalla = (f'[1:v]crop=716:1604:2:2,fps={FPS},trim=start={ini}:end={fin},setpts=PTS-STARTPTS,'
                f'tpad=stop_mode=clone:stop_duration={dur},trim=duration={dur},scale={SW}:{SH}:flags=lanczos,format=rgba[s0];')
    if banda:
        pantalla += '[s0][4:v]overlay=0:0[s1];'
    else:
        pantalla += '[s0]null[s1];'
    pantalla += '[3:v]format=gray[m];[s1][m]alphamerge[scr];'
    # Entrada del teléfono: sube 50 px con desaceleración en los primeros 0.6 s.
    yexp = f"{PY}+50*pow(max(0\\,1-t/0.6)\\,2)"
    grafo = (pantalla +
             f"[0:v][scr]overlay=x={PX + BISEL}:y='{yexp}+{BISEL}'[a];"
             f"[a][2:v]overlay=x={PX}:y='{yexp}',format=yuv420p[v]")
    salida = os.path.join(TMP, f'escena{n}.mp4')
    ffmpeg('-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', bg,
           '-i', os.path.join(FUENTE, archivo),
           '-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', os.path.join(TMP, 'bisel.png'),
           '-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', os.path.join(TMP, 'mascara.png'),
           '-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', os.path.join(TMP, 'banda.png'),
           '-filter_complex', grafo, '-map', '[v]', '-r', str(FPS), '-c:v', 'libx264', '-crf', '16',
           '-preset', 'medium', '-t', str(dur), salida)
    return salida, dur


def tarjeta(nombre, titulo, sub, dur):
    """Intro / cierre: logo grande, marca y lema, con un acercamiento lento."""
    im = Image.new('RGB', (W, H), (255, 231, 214))
    d = ImageDraw.Draw(im)
    d.ellipse((W // 2 - 520, H // 2 - 520, W // 2 + 520, H // 2 + 520), fill=(255, 222, 200))
    d.ellipse((330, 200, 380, 250), fill=ACCENT)
    d.rounded_rectangle((1540, 250, 1600, 310), 16, fill=PRIMARY)
    d.ellipse((1480, 800, 1530, 850), outline=NAVY, width=9)
    logo = Image.open(os.path.join(REPO, 'assets', 'brand', 'logo.png'))
    logo = logo.resize((round(logo.width * 260 / logo.height), 260), Image.LANCZOS)
    im.paste(logo, ((W - logo.width) // 2, 170), logo)
    wordmark(d, W / 2, 520, 110, anchor='mm')
    d.text((W / 2, 640), titulo, font=font('bold', 58), fill=PRIMARY_TEXT, anchor='mm')
    d.text((W / 2, 720), sub, font=font('regular', 38), fill=(92, 94, 116), anchor='mm')
    png = os.path.join(TMP, f'{nombre}.png')
    im.save(png)
    salida = os.path.join(TMP, f'{nombre}.mp4')
    frames = int(dur * FPS)
    ffmpeg('-loop', '1', '-framerate', str(FPS), '-i', png, '-filter_complex',
           f"scale=3840:-1,zoompan=z='1+0.04*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
           f"d={frames}:s={W}x{H}:fps={FPS},format=yuv420p",
           '-frames:v', str(frames), '-c:v', 'libx264', '-crf', '16', salida)
    return salida, dur


def unir(clips, salida):
    args, grafo = [], ''
    for ruta, _ in clips:
        args += ['-i', ruta]
    previo, acumulado = '0:v', clips[0][1]
    for i in range(1, len(clips)):
        offset = acumulado - TRANSICION
        etiqueta = f'x{i}'
        grafo += f'[{previo}][{i}:v]xfade=transition=fade:duration={TRANSICION}:offset={offset:.3f}[{etiqueta}];'
        previo, acumulado = etiqueta, offset + clips[i][1]
    grafo += f'[{previo}]format=yuv420p[v]'
    ffmpeg(*args, '-filter_complex', grafo, '-map', '[v]', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow',
           '-r', str(FPS), '-movflags', '+faststart', salida)
    return acumulado


if __name__ == '__main__':
    capas_telefono()
    clips = [tarjeta('intro', 'Que no se te pase ninguna beca', 'La app de oportunidades para estudiantes', 3.2)]
    for n, e in enumerate(ESCENAS, 1):
        clips.append(render_escena(n, e))
        print('escena', n, 'lista')
    clips.append(tarjeta('cierre', 'Descárgala gratis', 'Secundaria · Prepa · Universidad', 3.8))
    total = unir(clips, os.path.join(AQUI, 'becaria-promo.mp4'))
    print(f'listo: {total:.1f} s')
