"""Original offline medieval-inspired game effects; no third-party samples."""
from array import array
from pathlib import Path
import math
import random
import wave

RATE = 22050
root = Path('public/audio/effects')
root.mkdir(parents=True, exist_ok=True)


def render(name, duration, voices, noise=0, noise_decay=40):
    rng = random.Random(name)
    samples = []
    for i in range(round(duration * RATE)):
        t = i / RATE
        value = 0
        for frequency, gain, decay, start, glide in voices:
            age = t - start
            if age < 0:
                continue
            phase = 2 * math.pi * (frequency * age + glide * age * age / 2)
            attack = min(1, age / .002)
            value += math.sin(phase) * gain * math.exp(-age * decay) * attack
        value += rng.uniform(-1, 1) * noise * math.exp(-t * noise_decay) * min(1, t / .001)
        value *= min(1, (duration - t) / .025)
        samples.append(round(max(-.95, min(.95, value)) * 32767))
    with wave.open(str(root / (name + '.wav')), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(array('h', samples).tobytes())
    print(name, len(samples), 'samples', 'peak', max(abs(sample) for sample in samples))


# Short wooden mechanism taps with muted, inharmonic iron overtones.
for i, pitch in enumerate([1, 1.065, .94]):
    render(f'type-{i + 1}', .11, [(410 * pitch, .36, 65, 0, -250),
           (883 * pitch, .13, 85, 0, 0), (1710 * pitch, .055, 100, .004, 0)], .13, 100)

# A dull armor impact, falling body and a small lute-like reward flourish.
render('defeat', .62, [(145, .38, 12, 0, -100), (310, .13, 22, .025, -100),
       (587.33, .17, 15, .10, 0), (880, .12, 16, .17, 0)], .18, 20)
render('boss-defeat', 1.05, [(90, .38, 7, 0, -35), (190, .18, 12, .03, -30),
       (293.66, .18, 7, .12, 0), (440, .16, 9, .25, 0),
       (587.33, .15, 8, .38, 0), (880, .10, 10, .51, 0)], .2, 15)
render('strike', .22, [(620, .23, 23, 0, -700), (1460, .12, 30, 0, 0),
       (2300, .05, 45, 0, 0)], .15, 35)
render('hurt', .26, [(115, .36, 15, 0, -190), (220, .15, 24, .015, -250)], .13, 28)
render('start', .6, [(293.66, .24, 12, 0, 0), (440, .20, 12, .12, 0),
       (587.33, .17, 10, .24, 0)])
