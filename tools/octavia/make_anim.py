# วิดีโอพื้นขาว → แอนิเมชัน WebP พื้นโปร่งใส (color-to-alpha: ขาว = โปร่ง, ขอบ/ควัน/ขนนกจาง = โปร่งบางส่วน)
import subprocess, sys
import numpy as np
from PIL import Image

FF, SRC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T0, T1, FPS, W = 1.5, 6.0, 20, 640
SPEED = float(sys.argv[4]) if len(sys.argv) > 4 else 2.2   # เร่งความเร็วคลิปกี่เท่า
H = W * 720 // 1280
cmd = [FF, '-v', 'error', '-ss', str(T0), '-to', str(T1), '-i', SRC, '-map', '0:0',
       '-vf', f'setpts=PTS/{SPEED},fps={FPS},scale={W}:{H}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
n = len(raw) // (W * H * 3)
frames = np.frombuffer(raw, np.uint8)[: n * W * H * 3].reshape(n, H, W, 3).astype(np.float32)

out = []
for f in frames:
    # พื้นหลังจากวิดีโอไม่ขาวสนิท (≈245–255) → ยืดให้ 245 ขึ้นไปเป็นขาว
    c = np.clip(f * (255 / 244), 0, 255)
    a = (255 - c).max(axis=2) / 255
    a = np.clip((a - .02) / .98, 0, 1)          # ตัดจุดรบกวนจาง ๆ บนพื้น
    safe = np.maximum(a, 1e-3)[..., None]
    rgb = np.clip(255 - (255 - c) / safe, 0, 255)
    out.append(np.dstack([rgb, a[..., None] * 255]).astype(np.uint8))

# ครอปให้พอดีกรอบที่มีของในทุกเฟรม
alpha_any = np.max(np.stack([o[..., 3] for o in out]), axis=0) > 6
ys, xs = np.where(alpha_any)
y0, y1, x0, x1 = max(0, ys.min() - 4), min(H, ys.max() + 5), max(0, xs.min() - 4), min(W, xs.max() + 5)
imgs = [Image.fromarray(o[y0:y1, x0:x1], 'RGBA') for o in out]
dur = round(1000 / FPS)
imgs[0].save(OUT, save_all=True, append_images=imgs[1:], duration=dur, loop=1, quality=82, method=4, lossless=False)
# เฟรมสุดท้าย (ปีกกางเต็ม) แยกไว้เป็นภาพนิ่ง
imgs[-1].save(OUT.replace('.webp', '_last.png'))
print(n, 'frames', imgs[0].size, f'{n * dur} ms', 'crop', (x0, y0, x1, y1))
