"""Capturas de Play Store (1080x1920) y gráfico destacado (1024x500).

Parte de las capturas crudas del emulador en `fuente/` (Pixel 9 Pro, Android 15, barra de estado
en modo demo a las 9:41). Uso: `python store/play/componer.py` desde la raíz del repo (requiere Pillow).
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fuente')
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(REPO, 'store', 'play', 'capturas')
FONTS = os.path.join(REPO, 'node_modules', '@expo-google-fonts', 'poppins')
os.makedirs(OUT, exist_ok=True)


def font(peso, tam):
    nombre = {'regular': '400Regular/Poppins_400Regular', 'medium': '500Medium/Poppins_500Medium',
              'semibold': '600SemiBold/Poppins_600SemiBold', 'bold': '700Bold/Poppins_700Bold',
              'extrabold': '800ExtraBold/Poppins_800ExtraBold'}[peso]
    return ImageFont.truetype(os.path.join(FONTS, nombre + '.ttf'), tam)


W, H = 1080, 1920
NAVY = (43, 45, 66)
PRIMARY = (255, 122, 51)
PRIMARY_TEXT = (194, 74, 15)
ACCENT = (255, 193, 69)

CLARO = dict(texto=NAVY, resalte=PRIMARY_TEXT, sub=(92, 94, 116))
OSCURO = dict(texto=(255, 255, 255), resalte=ACCENT, sub=(201, 202, 214))

# Barra de estado limpia (9:41, wifi, batería) para tapar contenido que pasa por debajo al hacer scroll.
BANDA = Image.open(os.path.join(SCR, 'c_fav.png')).convert('RGB').crop((0, 0, 1280, 150))

SLIDES = [
    dict(img='c_land4.png', banda=False, fondo=(255, 231, 214), circulo=(255, 214, 186), tema=CLARO,
         titulo=[('Becas y más, ', 0), ('en un solo lugar', 1)],
         sub='Becas, concursos, movilidades y certificaciones para estudiantes',
         chip='Secundaria · Prepa · Universidad', chip_lado='izq', chip_f=0.52),
    dict(img='c_home.png', fondo=(255, 240, 199), circulo=(255, 226, 150), tema=CLARO,
         titulo=[('Encuentra tu próxima ', 0), ('oportunidad', 1)],
         sub='Busca, explora por tema o tira el dado y déjate sorprender',
         chip='9 temas', chip_lado='der', chip_f=0.302),
    dict(img='c_parati.png', fondo=NAVY, circulo=(58, 61, 88), tema=OSCURO,
         titulo=[('Sugerencias ', 0), ('hechas para ti', 1)],
         sub='Elegidas según tu nivel y lo que te interesa',
         chip='Te interesa Negocios', chip_lado='der', chip_f=0.335),
    dict(img='c_det.png', fondo=(220, 234, 247), circulo=(196, 218, 240), tema=CLARO,
         titulo=[('Toda la info, ', 0), ('clara y directa', 1)],
         sub='Fechas, requisitos, beneficios y el enlace a la convocatoria oficial',
         chip='Revisada por nuestro equipo', chip_lado='der', chip_f=0.728),
    dict(img='c_fav.png', fondo=(253, 227, 234), circulo=(250, 204, 216), tema=CLARO,
         titulo=[('Guarda las que ', 0), ('te laten', 1)],
         sub='Tus favoritas siempre a la mano, incluso sin internet',
         chip='Funciona sin internet', chip_lado='der', chip_f=0.75),
    dict(img='c_cal.png', fondo=NAVY, circulo=(58, 61, 88), tema=OSCURO,
         titulo=[('Tus fechas límite, ', 0), ('de un vistazo', 1)],
         sub='Un punto de color marca cada cierre de tus favoritas',
         chip='Cierra en 4 días', chip_lado='der', chip_f=0.525, chip_color=(242, 169, 60)),
    dict(img='c_avisos2.png', fondo=(220, 241, 227), circulo=(194, 228, 205), tema=CLARO,
         titulo=[('Te avisamos ', 0), ('antes de que cierre', 1)],
         sub='Recordatorios 7, 3 y 1 día antes de cada fecha límite',
         chip='Cierra mañana', chip_lado='der', chip_f=0.418, chip_color=(229, 72, 77)),
    dict(img='c_perfil.png', fondo=(255, 231, 214), circulo=(255, 214, 186), tema=CLARO,
         titulo=[('Tu perfil, ', 0), ('tu estilo', 1)],
         sub='Sin nombre real ni fotos: tu privacidad va primero',
         chip='Sin anuncios', chip_lado='der', chip_f=0.555),
]

TITULO = font('bold', 72)
SUB = font('regular', 36)
CHIP = font('semibold', 31)
MARGEN = 70
ANCHO_TEXTO = W - 2 * MARGEN


def envolver_rico(segmentos, fuente, ancho):
    """Parte segmentos (texto, resaltado) en líneas de palabras con su color."""
    palabras = []
    for texto, res in segmentos:
        for i, p in enumerate(texto.split(' ')):
            if p:
                palabras.append((p, res))
    lineas, actual = [], []
    for p in palabras:
        prueba = ' '.join(w for w, _ in actual + [p])
        if actual and fuente.getlength(prueba) > ancho:
            lineas.append(actual)
            actual = [p]
        else:
            actual.append(p)
    lineas.append(actual)
    return lineas


def envolver(texto, fuente, ancho):
    lineas, actual = [], ''
    for p in texto.split(' '):
        prueba = (actual + ' ' + p).strip()
        if actual and fuente.getlength(prueba) > ancho:
            lineas.append(actual)
            actual = p
        else:
            actual = prueba
    lineas.append(actual)
    return lineas


def sombra(tam, caja, radio, blur, opacidad, offset=(0, 24)):
    capa = Image.new('RGBA', tam, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    x0, y0, x1, y1 = caja
    d.rounded_rectangle((x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]), radio,
                        fill=(20, 22, 40, int(255 * opacidad)))
    return capa.filter(ImageFilter.GaussianBlur(blur))


def pantalla(slide):
    im = Image.open(os.path.join(SCR, slide['img'])).convert('RGB')
    if slide.get('banda', True):
        im.paste(BANDA, (0, 0))
    return im


def telefono(im, ancho):
    alto = round(im.height * ancho / im.width)
    scr = im.resize((ancho, alto), Image.LANCZOS)
    bisel = 16
    radio = 62
    marco = Image.new('RGBA', (ancho + 2 * bisel, alto + 2 * bisel), (0, 0, 0, 0))
    d = ImageDraw.Draw(marco)
    d.rounded_rectangle((0, 0, marco.width - 1, marco.height - 1), radio + bisel, fill=(24, 25, 38, 255))
    mascara = Image.new('L', scr.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, ancho - 1, alto - 1), radio, fill=255)
    marco.paste(scr, (bisel, bisel), mascara)
    # Cámara perforada
    cx = marco.width // 2
    d.ellipse((cx - 11, bisel + 16, cx + 11, bisel + 38), fill=(24, 25, 38, 255))
    return marco


def chip(lienzo, texto, lado, y, x_tel0, x_tel1, color_punto):
    pad_x, alto = 30, 78
    ancho = int(CHIP.getlength(texto)) + pad_x * 2 + 34
    x = x_tel0 - 70 if lado == 'izq' else x_tel1 + 70 - ancho
    x = max(36, min(W - 36 - ancho, x))
    caja = (x, y, x + ancho, y + alto)
    lienzo.alpha_composite(sombra(lienzo.size, caja, alto // 2, 18, 0.22, (0, 12)))
    d = ImageDraw.Draw(lienzo)
    d.rounded_rectangle(caja, alto // 2, fill=(255, 255, 255, 255))
    d.ellipse((x + pad_x, y + alto // 2 - 9, x + pad_x + 18, y + alto // 2 + 9), fill=color_punto)
    d.text((x + pad_x + 34, y + alto // 2), texto, font=CHIP, fill=NAVY, anchor='lm')


def componer(n, slide):
    tema = slide['tema']
    lienzo = Image.new('RGBA', (W, H), slide['fondo'] + (255,))
    d = ImageDraw.Draw(lienzo)

    # Decoración: círculo grande detrás del teléfono y puntos de color (mismo lenguaje que AuthArt).
    d.ellipse((W // 2 - 520, 700, W // 2 + 520, 1740), fill=slide['circulo'])
    d.ellipse((70, 600, 112, 642), fill=ACCENT)
    d.rounded_rectangle((968, 660, 1018, 710), 14, fill=PRIMARY)
    d.ellipse((976, 1600, 1016, 1640), outline=NAVY if tema is CLARO else (255, 255, 255), width=8)

    # Título con palabra resaltada
    y = 120
    lineas_titulo = envolver_rico(slide['titulo'], TITULO, ANCHO_TEXTO)
    assert len(lineas_titulo) <= 2, slide['titulo']
    for linea in lineas_titulo:
        texto = ' '.join(w for w, _ in linea)
        x = (W - TITULO.getlength(texto)) / 2
        for i, (w, res) in enumerate(linea):
            pieza = w + (' ' if i < len(linea) - 1 else '')
            d.text((x, y), pieza, font=TITULO, fill=tema['resalte'] if res else tema['texto'])
            x += TITULO.getlength(pieza)
        y += 88
    y += 18
    for linea in envolver(slide['sub'], SUB, ANCHO_TEXTO - 40):
        d.text((W / 2, y), linea, font=SUB, fill=tema['sub'], anchor='ma')
        y += 52

    # Teléfono
    assert y <= 440, slide['sub']
    tel = telefono(pantalla(slide), 620)
    tx = (W - tel.width) // 2
    ty = 470
    caja = (tx, ty, tx + tel.width, ty + tel.height)
    lienzo.alpha_composite(sombra(lienzo.size, caja, 80, 40, 0.30))
    lienzo.alpha_composite(tel, (tx, ty))

    chip_y = ty + 16 + round(slide['chip_f'] * (tel.height - 32)) - 40
    chip(lienzo, slide['chip'], slide['chip_lado'], chip_y, tx, tx + tel.width,
         slide.get('chip_color', PRIMARY))

    ruta = os.path.join(OUT, f'{n:02d}.png')
    lienzo.convert('RGB').save(ruta, optimize=True)
    return ruta


for n, s in enumerate(SLIDES, 1):
    print(componer(n, s))


def grafico_destacado():
    """Gráfico destacado de Play Store (1024x500)."""
    GW, GH = 1024, 500
    g = Image.new('RGBA', (GW, GH), (255, 231, 214, 255))
    d = ImageDraw.Draw(g)
    # Ilustración a la derecha dentro de un círculo grande que se sale del borde
    ilus = Image.open(os.path.join(REPO, 'assets', 'landing', 'slide-3.jpg')).convert('RGB')
    lado = 560
    ilus = ilus.resize((lado, round(ilus.height * lado / ilus.width)), Image.LANCZOS).crop((0, 0, lado, lado))
    mascara = Image.new('L', (lado, lado), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, lado - 1, lado - 1), fill=255)
    cx, cy = 790, 250
    d.ellipse((cx - lado // 2 - 18, cy - lado // 2 - 18, cx + lado // 2 + 18, cy + lado // 2 + 18), fill=(255, 214, 186))
    g.paste(ilus, (cx - lado // 2, cy - lado // 2), mascara)
    # Logo + marca + lema a la izquierda
    logo = Image.open(os.path.join(REPO, 'assets', 'brand', 'logo.png'))
    lh = 120
    logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
    g.alpha_composite(logo, (64, 70))
    # Wordmark como en la app: el punto en naranja.
    marca = font('bold', 64)
    x = 64 + logo.width + 22
    for pieza, color in (('Becar', NAVY), ('.', PRIMARY), ('ia', NAVY)):
        d.text((x, 70 + lh // 2), pieza, font=marca, fill=color, anchor='lm')
        x += marca.getlength(pieza)
    t = font('bold', 46)
    d.text((64, 238), 'Que no se te pase', font=t, fill=NAVY)
    d.text((64, 294), 'ninguna beca', font=t, fill=PRIMARY_TEXT)
    d.text((64, 376), 'Becas, concursos, movilidades y', font=font('regular', 24), fill=(92, 94, 116))
    d.text((64, 408), 'certificaciones para estudiantes', font=font('regular', 24), fill=(92, 94, 116))
    ruta = os.path.join(REPO, 'store', 'play', 'grafico-destacado.png')
    g.convert('RGB').save(ruta, optimize=True)
    return ruta


print(grafico_destacado())
