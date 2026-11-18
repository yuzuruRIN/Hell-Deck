# วิดีโอ Striker ควบม้าไฟ (พื้นขาว) → แอนิเมชัน WebP พื้นโปร่งใส เล่นครั้งเดียว ค้างเฟรมสุดท้าย (ม้ายกขาหน้า + ไฟลุกที่เท้า)
# - ตัวละคร: ทึบเต็มที่ (พื้นขาวที่ต่อกับขอบภาพ = พื้นหลัง, หาด้วย flood fill)
# - พื้นหลังที่มีแสงไฟเรืองอมส้ม: color-to-alpha → แสงไฟยังเห็นเป็นออร่าโปร่ง ๆ บนพื้นมืดของเกม
# usage: python make_anim.py <ffmpeg.exe> <video.mp4> <out.webp> [speed=1.6] [t0=1.0] [t1=2.85]
import subprocess, sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

FF, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SPEED = float(sys.argv[4]) if len(sys.argv) > 4 else 1.6
T0 = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
T1 = float(sys.argv[6]) if len(sys.argv) > 6 else 2.85
FPS, H = 20, 520
W = round(784 * H / 1168)
cmd = [FF, '-v', 'error', '-ss', str(T0), '-to', str(T1), '-i', SRC, '-map', '0:0',
       '-vf', f'setpts=PTS/{SPEED},fps={FPS},scale={W}:{H}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
n = len(raw) // (W * H * 3)
frames = np.frombuffer(raw, np.uint8)[: n * W * H * 3].reshape(n, H, W, 3)

def bg_mask(f):
    # พื้นหลัง = พิกเซลสว่าง (ขาว หรือแสงไฟจาง ๆ บนพื้นขาว) ที่ต่อกับขอบภาพ
    near = (f.astype(np.int16).sum(axis=2) > 600) & (f.min(axis=2) > 150)
    bg = np.zeros(near.shape, bool)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if near[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if near[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and near[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    # ช่องพื้นขาวที่ถูกล้อมไว้ (ระหว่างหางกับตัว / ใต้ท้องม้า): ขาวเกือบล้วน สีไม่จัด (ไม่โดนสีผิว) และก้อนใหญ่พอ
    fi = f.astype(np.int16)
    pocket = (fi.min(axis=2) > 212) & ((fi.max(axis=2) - fi.min(axis=2)) < 48) & ~bg
    seen = np.zeros_like(bg)
    for sy, sx in zip(*np.nonzero(pocket)):
        if seen[sy, sx]: continue
        comp = [(sy, sx)]; seen[sy, sx] = True; i = 0
        while i < len(comp):
            y, x = comp[i]; i += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and pocket[ny, nx]:
                    seen[ny, nx] = True; comp.append((ny, nx))
        if len(comp) > 160:
            for y, x in comp: bg[y, x] = True
    return bg

out = []
for f in frames:
    ff = f.astype(np.float32)
    bg = bg_mask(f)
    # color-to-alpha (ขาว → โปร่ง) ใช้กับพื้นหลังและแถบขอบตัวละคร
    c = np.clip(ff * (255 / 246), 0, 255)
    a = np.clip(((255 - c).max(axis=2) / 255 - .02) / .98, 0, 1)
    safe = np.maximum(a, 1e-3)[..., None]
    soft = np.clip(255 - (255 - c) / safe, 0, 255)
    edge = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    zone = bg | (edge & ~bg)
    alpha = np.where(zone, a, 1.0)
    rgb = np.where(zone[..., None], soft, ff)
    out.append(np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8))

alpha_any = np.max(np.stack([o[..., 3] for o in out]), axis=0) > 10
ys, xs = np.where(alpha_any)
y0, y1, x0, x1 = max(0, ys.min() - 2), min(H, ys.max() + 3), max(0, xs.min() - 2), min(W, xs.max() + 3)
imgs = [Image.fromarray(o[y0:y1, x0:x1], 'RGBA') for o in out]
dur = round(1000 / FPS)
imgs[0].save(OUT, save_all=True, append_images=imgs[1:], duration=dur, loop=1, quality=84, method=4)
imgs[-1].save(OUT.replace('.webp', '_last.png'))
print(n, 'frames', imgs[0].size, f'{n * dur} ms', 'crop', (x0, y0, x1, y1))
