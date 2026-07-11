#!/usr/bin/env python3
"""สังเคราะห์ SFX คุณภาพเกมสำหรับ Eimaths Bounty Hunter
ผลลัพธ์: public/assets/sfx/{correct-1,correct-2,correct-3,wrong}.mp3
เทคนิค: additive synthesis + ADSR + detune + sparkle noise + soft clip
"""
import numpy as np
import subprocess, os, sys

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'sfx')
os.makedirs(OUT, exist_ok=True)


def adsr(n, a=0.008, d=0.08, s=0.5, r=0.25, dur=None):
    """envelope เป็นวินาที"""
    dur = dur if dur is not None else n / SR
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.zeros(n)
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    idx = 0
    env[idx:idx + a_n] = np.linspace(0, 1, a_n, endpoint=False); idx += a_n
    env[idx:idx + d_n] = np.linspace(1, s, d_n, endpoint=False); idx += d_n
    env[idx:idx + s_n] = s; idx += s_n
    env[idx:] = np.linspace(s, 0, n - idx, endpoint=False)
    return env


def bell(freq, dur, vol=1.0, bright=1.0):
    """โทน marimba/celesta: fundamental + harmonics ผุพร้อม envelope ต่างกัน"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = [(1.0, 1.0, 1.0), (2.76, 0.35 * bright, 2.2), (5.4, 0.12 * bright, 3.5)]
    sig = np.zeros(n)
    for ratio, amp, decay in partials:
        env = np.exp(-t * decay / dur * 4)
        # detune เล็กน้อยให้เสียงหนา
        sig += amp * env * (np.sin(2 * np.pi * freq * ratio * t)
                            + 0.4 * np.sin(2 * np.pi * freq * ratio * 1.003 * t))
    sig *= adsr(n, a=0.004, d=dur * 0.3, s=0.35, r=dur * 0.45)
    return vol * sig


def sparkle(dur, vol=0.15):
    """ประกายแก้ว: filtered noise สั้นๆ"""
    n = int(dur * SR)
    noise = np.random.default_rng(7).standard_normal(n)
    # highpass หยาบๆ ด้วย diff
    noise = np.diff(noise, prepend=0)
    env = np.exp(-np.arange(n) / SR * 18)
    return vol * noise * env


def place(canvas, sig, at):
    i = int(at * SR)
    end = min(len(canvas), i + len(sig))
    canvas[i:end] += sig[:end - i]


def finish(sig, name, peak=0.71):
    sig = np.tanh(sig * 1.2)  # soft clip กันพีคแตก
    sig = sig / np.max(np.abs(sig)) * peak
    stereo = np.stack([sig, sig])
    # ทำ stereo กว้างขึ้นนิดด้วย delay 6ms ข้างขวา
    d = int(0.006 * SR)
    stereo[1] = np.concatenate([np.zeros(d), stereo[1][:-d]])
    pcm = (stereo.T * 32767).astype(np.int16)
    raw = os.path.join(OUT, name + '.wav')
    import wave
    with wave.open(raw, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw,
                    '-codec:a', 'libmp3lame', '-b:a', '128k', os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(raw)
    print(name, os.path.getsize(os.path.join(OUT, name + '.mp3')), 'bytes')


C5, E5, G5, C6, E6, G6, A5, F5, D5, B4, G4 = 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 880.0, 698.46, 587.33, 493.88, 392.0

# ---------- correct-1: ธรรมดา — ding สองโน้ตนุ่มๆ ----------
n = int(0.55 * SR); c = np.zeros(n)
place(c, bell(C6, 0.30, 0.9), 0.0)
place(c, bell(E6, 0.35, 0.8), 0.10)
finish(c, 'correct-1')

# ---------- correct-2: ดีใจ — อาร์เปจโจ 3 โน้ตขึ้น + ประกาย ----------
n = int(0.9 * SR); c = np.zeros(n)
for i, f in enumerate([C5, E5, G5]):
    place(c, bell(f * 2, 0.32, 0.85, bright=1.2), i * 0.09)
place(c, bell(C6 * 2, 0.4, 0.55, bright=1.3), 0.27)
place(c, sparkle(0.5, 0.12), 0.25)
finish(c, 'correct-2')

# ---------- correct-3: ดีใจมากๆ — แฟนแฟร์คอร์ด + กลิสขึ้น + ประกายยาว ----------
n = int(1.6 * SR); c = np.zeros(n)
# คอร์ดตุ้มๆ 2 จังหวะ
for at, notes in [(0.0, [C5, E5, G5]), (0.16, [F5, A5, C6])]:
    for f in notes:
        place(c, bell(f, 0.35, 0.5), at)
# กลิสขึ้นเร็วๆ
for i, f in enumerate([C5, D5, E5, F5, G5, A5, B4 * 2, C6]):
    place(c, bell(f * 2, 0.16, 0.3, bright=1.4), 0.34 + i * 0.045)
# คอร์ดจบใหญ่
for f in [C5, G5, C6, E6, G6]:
    place(c, bell(f, 0.9, 0.55, bright=1.1), 0.75)
place(c, sparkle(0.9, 0.16), 0.72)
finish(c, 'correct-3', peak=0.78)

# ---------- wrong: ตอบผิด — สองโน้ตลงนุ่มๆ ไม่หลอนเด็ก ----------
n = int(0.7 * SR); c = np.zeros(n)


def soft(freq, dur, vol):
    m = int(dur * SR); t = np.arange(m) / SR
    # sine + องศาคู่ต่ำ ให้เสียงทู่ๆ อบอุ่น
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 0.5 * t)
    # vibrato เล็กน้อยแบบ "อุ๊ปส์"
    s *= (1 + 0.06 * np.sin(2 * np.pi * 7 * t))
    return vol * s * adsr(m, a=0.01, d=0.1, s=0.6, r=dur * 0.5)


place(c, soft(E5 * 0.5, 0.28, 0.8), 0.0)
place(c, soft(B4 * 0.5, 0.42, 0.85), 0.20)
finish(c, 'wrong', peak=0.6)
print('DONE')
