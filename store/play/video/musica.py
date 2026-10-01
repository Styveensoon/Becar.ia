"""Música original para el video promocional (sintetizada, sin derechos de terceros).

Pop suave a 96 BPM en Do mayor (Do-Sol-Lam-Fa): pad, arpegio pulsado (Karplus-Strong), bajo y
batería ligera. Uso: `python store/play/video/musica.py` -> `musica.wav` (estéreo, 48 kHz).
"""
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DURACION = 62.3
BPM = 96
BEAT = 60 / BPM
COMPAS = 4 * BEAT
N = int(DURACION * SR)
rng = np.random.default_rng(7)

# Acordes (MIDI): Do, Sol, Lam, Fa
ACORDES = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
RAICES = [36, 43, 45, 41]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, fc, orden=2):
    return sosfilt(butter(orden, fc, 'low', fs=SR, output='sos'), x)


def highpass(x, fc, orden=2):
    return sosfilt(butter(orden, fc, 'high', fs=SR, output='sos'), x)


def bandpass(x, f1, f2):
    return sosfilt(butter(2, [f1, f2], 'band', fs=SR, output='sos'), x)


def poner(pista, señal, inicio):
    i = int(inicio * SR)
    if i >= len(pista):
        return
    fin = min(len(pista), i + len(señal))
    pista[i:fin] += señal[:fin - i]


def pad(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.06, 0.0, 0.07):  # voces levemente desafinadas = coro cálido
        f = hz(m) * 2 ** (det / 12)
        x += np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return lowpass(x / 3, 1800) * env_adsr(n, 0.6, 0.4, 0.8, 0.8)


def pulsada(m, dur, brillo=0.5):
    """Karplus-Strong: cuerda pulsada."""
    n = int(dur * SR)
    f = hz(m)
    periodo = int(SR / f)
    buf = rng.uniform(-1, 1, periodo)
    buf = lowpass(buf, 2000 + 5000 * brillo, 1)
    out = np.zeros(n)
    for i in range(n):
        v = buf[i % periodo]
        out[i] = v
        buf[i % periodo] = 0.996 * 0.5 * (v + buf[(i + 1) % periodo])
    return out * env_adsr(n, 0.002, 0.05, 1.0, 0.05)


def bajo(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return lowpass(x, 600) * env_adsr(n, 0.01, 0.15, 0.6, 0.08)


def bombo():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 28)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-t * 9)


def palmada():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    ruido = bandpass(rng.normal(0, 1, n), 900, 5000)
    return ruido * np.exp(-t * 22) * 0.6


def hihat(abierto=False):
    n = int((0.18 if abierto else 0.06) * SR)
    t = np.arange(n) / SR
    return highpass(rng.normal(0, 1, n), 7000) * np.exp(-t * (18 if abierto else 70)) * 0.35


def reverb(x, segundos=1.8, mezcla=0.22):
    n = int(segundos * SR)
    t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t * 3.2)
    ir = lowpass(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    húmedo = fftconvolve(x, ir)[:len(x)]
    return (1 - mezcla) * x + mezcla * húmedo


def main():
    pads, arpegio, bajos, bat = (np.zeros(N) for _ in range(4))
    compases = int(np.ceil(DURACION / COMPAS))
    for c in range(compases):
        t0 = c * COMPAS
        k = c % 4
        acorde = ACORDES[k]
        # Pad durante todo el video
        for m in acorde:
            poner(pads, pad(m, COMPAS + 0.6), t0)
        # Arpegio en corcheas: sube y baja por el acorde una octava arriba
        patron = [0, 1, 2, 1, 2, 0, 1, 2]
        for j, idx in enumerate(patron):
            nota = acorde[idx] + 12 + (12 if j in (4, 6) else 0)
            poner(arpegio, pulsada(nota, 0.9, brillo=0.4 + 0.1 * (j % 2)), t0 + j * BEAT / 2)
        # Base rítmica: entra en el compás 2 y sale en los últimos ~4 s
        if 1 <= c and t0 < DURACION - 4.2:
            poner(bajos, bajo(RAICES[k], BEAT * 1.5), t0)
            poner(bajos, bajo(RAICES[k], BEAT), t0 + 2 * BEAT)
            poner(bajos, bajo(RAICES[k] + 12, BEAT / 2), t0 + 3.5 * BEAT)
            for b in range(4):
                if b in (0, 2):
                    poner(bat, bombo(), t0 + b * BEAT)
                else:
                    poner(bat, palmada(), t0 + b * BEAT)
            for h in range(8):
                poner(bat, hihat(abierto=(h == 7)), t0 + h * BEAT / 2 + (0.012 if h % 2 else 0))

    def norm(x):
        return x / (np.max(np.abs(x)) + 1e-9)

    izq = 0.30 * norm(pads) + 0.30 * norm(arpegio) + 0.30 * norm(bajos) + 0.32 * norm(bat)
    # Estéreo: el arpegio y el pad se abren con un retardo corto en un canal.
    retardo = int(0.012 * SR)
    der = 0.30 * norm(np.concatenate([np.zeros(retardo), pads[:-retardo]])) + \
        0.30 * norm(np.concatenate([np.zeros(retardo * 2), arpegio[:-retardo * 2]])) + \
        0.30 * norm(bajos) + 0.32 * norm(bat)
    izq, der = reverb(izq), reverb(der)
    # Entrada y salida suaves
    env = np.ones(N)
    entra, sale = int(1.2 * SR), int(3.0 * SR)
    env[:entra] = np.linspace(0, 1, entra)
    env[-sale:] = np.linspace(1, 0, sale)
    estereo = np.stack([izq * env, der * env], axis=1)
    estereo /= np.max(np.abs(estereo)) / 0.89
    salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'musica.wav')
    wavfile.write(salida, SR, (estereo * 32767).astype(np.int16))
    print(salida)


if __name__ == '__main__':
    main()
