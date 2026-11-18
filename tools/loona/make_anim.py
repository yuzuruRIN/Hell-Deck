# วิดีโอเงา Loona (พื้นขาว) → แอนิเมชัน WebP พื้นโปร่งใส เล่นครั้งเดียว ค้างเฟรมสุดท้าย (ท่าเงยหน้าหอน)
# - ลบเฉพาะพื้นขาวที่ต่อกับขอบภาพ (flood fill) เส้นสีขาวในตัวเงาจึงไม่กลายเป็นรู
# - ตัวเงาเป็นสีดำอมแดง เส้นลายในตัวเป็นสีแดงเรือง ๆ ให้เข้ากับพระจันทร์สีแดง
# usage: python make_anim.py <ffmpeg.exe> <video.mp4> <out.webp> [speed=1.6]
import subprocess, sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

FF, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SPEED = float(sys.argv[4]) if len(sys.argv) > 4 else 1.6
T0, T1, FPS, H = 1.0, 3.6, 20, 480
W = round(784 * H / 1168)
cmd = [FF, '-v', 'error', '-ss', str(T0), '-to', str(T1), '-i', SRC, '-map', '0:0',
       '-vf', f'setpts=PTS/{SPEED},fps={FPS},scale={W}:{H}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
n = len(raw) // (W * H * 3)
frames = np.frombuffer(raw, np.uint8)[: n * W * H * 3].reshape(n, H, W, 3)

INK = np.array([10, 3, 6], np.float32)       # สีตัวเงา
LINE = np.array([255, 70, 92], np.float32)   # สีเส้นลายในตัว

def bg_mask(f):
    near = f.min(axis=2) > 225
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
    # ช่องพื้นขาวที่ถูกล้อมไว้ (เช่น ช่องระหว่างผมกับคอ) ก็เป็นพื้นหลัง — ตัดเฉพาะก้อนใหญ่ เส้นลายบาง ๆ ยังอยู่
    seen = bg.copy()
    for sy, sx in zip(*np.nonzero(near & ~bg)):
        if seen[sy, sx]: continue
        comp = [(sy, sx)]; seen[sy, sx] = True; i = 0
        while i < len(comp):
            y, x = comp[i]; i += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and near[ny, nx]:
                    seen[ny, nx] = True; comp.append((ny, nx))
        ys_, xs_ = zip(*comp)
        if len(comp) > 220 and (max(ys_) - min(ys_)) > 10 and (max(xs_) - min(xs_)) > 10:
            for y, x in comp: bg[y, x] = True
    return bg

out = []
for f in frames:
    bg = bg_mask(f)
    lum = f.astype(np.float32).mean(axis=2) / 255
    # ขอบตัวเงา (ติดพื้นหลัง): ความทึบตามความมืด เพื่อขอบเนียนไม่มีขอบขาว
    edge = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    alpha = np.where(bg, 0.0, 1.0)
    band = edge & ~bg
    alpha = np.where(band, np.clip((1 - lum) / .9, 0, 1), alpha)
    # ในตัว: ดำ → สีเงา, ขาว (เส้นลาย) → แดงเรือง (ขอบนอกเป็นสีเงาล้วน)
    t = np.where(band, 0, np.clip((lum - .25) / .6, 0, 1))[..., None]
    rgb = INK * (1 - t) + LINE * t
    out.append(np.dstack([rgb, alpha[..., None] * 255]).astype(np.uint8))

alpha_any = np.max(np.stack([o[..., 3] for o in out]), axis=0) > 6
ys, xs = np.where(alpha_any)
y0, y1, x0, x1 = max(0, ys.min() - 2), H, max(0, xs.min() - 2), min(W, xs.max() + 3)
imgs = [Image.fromarray(o[y0:y1, x0:x1], 'RGBA') for o in out]
dur = round(1000 / FPS)
imgs[0].save(OUT, save_all=True, append_images=imgs[1:], duration=dur, loop=1, quality=85, method=4)
imgs[-1].save(OUT.replace('.webp', '_last.png'))
print(n, 'frames', imgs[0].size, f'{n * dur} ms')
