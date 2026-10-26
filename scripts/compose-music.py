"""Render the original Runeblade woodland dance using only Python's standard library.

6/8, D Dorian, 100 dotted-quarter beats/minute. No samples or external assets.
Run from the project root. The generated PCM WAV is the shipped offline soundtrack.
"""
from array import array
from pathlib import Path
import math
import random
import wave

RATE = 22050
PULSE = 0.2
BAR = 6 * PULSE
BARS = 64
LENGTH = round(BARS * BAR * RATE)
mix = array('f', [0.0]) * LENGTH
rng = random.Random(731)


def note(midi, start, duration, instrument, gain):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    offset = round(start * RATE)
    for i in range(round(duration * RATE)):
        t = i / RATE
        phase = 2 * math.pi * frequency * t
        if instrument == 'lute':
            envelope = min(1, t / 0.006) * math.exp(-5.4 * t) * min(1, (duration - t) / 0.07)
            sample = math.sin(phase) + .34 * math.sin(phase * 2) + .13 * math.sin(phase * 3) + .05 * math.sin(phase * 4)
        elif instrument == 'recorder':
            envelope = min(1, t / .045) * min(1, (duration - t) / .09)
            phase += .012 * math.sin(2 * math.pi * 4.8 * t)
            sample = math.sin(phase) + .12 * math.sin(phase * 2) + .035 * math.sin(phase * 3)
        else:
            envelope = min(1, t / .06) * min(1, (duration - t) / .15) * math.exp(-1.5 * t)
            sample = math.sin(phase) + .14 * math.sin(phase * 2)
        # Wrap the release across the seam, so the loop has no cut-off notes.
        mix[(offset + i) % LENGTH] += sample * envelope * gain


chords = [(50, 57, 62, 65), (48, 55, 60, 64), (43, 55, 59, 62), (50, 57, 62, 65),
          (41, 53, 57, 60), (48, 55, 60, 64), (45, 57, 60, 64), (50, 57, 62, 65)]
# Handwritten melodies, each entry gives eighth-note duration and MIDI pitch.
melodies = [
    [[(2, 74), (1, 76), (2, 77), (1, 76)], [(3, 72), (2, 67), (1, 69)],
     [(2, 71), (1, 74), (2, 79), (1, 77)], [(3, 76), (2, 74), (1, 0)],
     [(2, 77), (1, 79), (2, 81), (1, 79)], [(2, 76), (1, 74), (3, 72)],
     [(2, 69), (1, 72), (2, 76), (1, 72)], [(5, 74), (1, 0)]],
    [[(1, 81), (1, 79), (1, 77), (2, 76), (1, 74)], [(2, 76), (1, 79), (3, 84)],
     [(2, 83), (1, 81), (2, 79), (1, 77)], [(3, 76), (2, 74), (1, 0)],
     [(2, 81), (1, 77), (2, 72), (1, 77)], [(3, 79), (2, 76), (1, 72)],
     [(2, 76), (1, 72), (2, 69), (1, 72)], [(5, 74), (1, 0)]],
    [[(3, 69), (2, 74), (1, 77)], [(2, 76), (1, 72), (2, 67), (1, 0)],
     [(3, 71), (2, 74), (1, 79)], [(2, 77), (1, 76), (3, 74)],
     [(3, 72), (2, 77), (1, 81)], [(2, 79), (1, 76), (2, 72), (1, 0)],
     [(2, 72), (1, 76), (2, 81), (1, 79)], [(5, 74), (1, 0)]],
]
for bar in range(BARS):
    start = bar * BAR
    chord = chords[bar % 8]
    section = (bar // 16) % 3
    for pulse, chord_index in enumerate([0, 2, 3, 1, 2, 3]):
        note(chord[chord_index], start + pulse * PULSE, .65, 'lute', .13 if pulse in (0, 3) else .075)
    for pulse in (0, 3):
        note(chord[0] - 12, start + pulse * PULSE, .55, 'bass', .09)
    # A lute-only interlude gives the melody room to breathe.
    if bar not in (14, 15, 30, 31, 46, 47):
        cursor = 0
        for duration, pitch in melodies[section][bar % 8]:
            if pitch:
                note(pitch, start + cursor * PULSE + .012, duration * PULSE * .9, 'recorder', .105)
            cursor += duration
    # Quiet tambourine taps, with a short, filtered-sounding noise decay.
    for pulse in (0, 3):
        offset = round((start + pulse * PULSE) * RATE)
        previous = 0
        for i in range(round(.075 * RATE)):
            noise = rng.uniform(-1, 1)
            mix[(offset + i) % LENGTH] += (noise - previous) * math.exp(-i / (RATE * .014)) * .014
            previous = noise

peak = max(abs(value) for value in mix)
pcm = array('h', (round(value / peak * 26000) for value in mix))
destination = Path('public/audio/whispering-woods.wav')
destination.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(destination), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(pcm.tobytes())
print(f'{destination}: {BARS * BAR:.1f}s, peak={max(abs(v) for v in pcm)}, {destination.stat().st_size:,} bytes')
