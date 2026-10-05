"""Edge-trace a photo into SVG polyline paths for the How we work sketch.

Writes src/lib/sketch-resolve-paths.ts (the path data SketchResolve draws) and
a black-on-white SVG preview of the same paths for checking by eye.

Needs Python 3 with OpenCV and NumPy:
    python3 -m venv ~/.venvs/trace-sketch
    ~/.venvs/trace-sketch/bin/pip install opencv-python-headless numpy

Run from the repo root (the numbers are the settings used for the current sketch):
    ~/.venvs/trace-sketch/bin/python scripts/trace-sketch.py public/home/source.jpg \
        src/lib/sketch-resolve-paths.ts /tmp/sketch-preview.svg 30 90 80 180 1.5 7 4 11

Arguments: in.jpg out.ts out.svg [low high min_len max_paths eps blur clahe max_wiggle]
  low, high   Canny edge thresholds
  min_len     shortest edge kept, in pixels
  max_paths   longest N edges kept
  eps         polyline simplification tolerance
  blur        Gaussian blur kernel size (odd)
  clahe       local contrast boost before edge detection (0 = off)
  max_wiggle  drop edges with more than this many points per 100px (0 = off)

The current paths were traced from the uncompressed crop before it was saved as
public/home/source.jpg, so re-running on source.jpg gives a near-identical but
not byte-identical result.
"""
import sys
import cv2
import numpy as np

src, out_ts, out_svg = sys.argv[1:4]
low = int(sys.argv[4]) if len(sys.argv) > 4 else 60
high = int(sys.argv[5]) if len(sys.argv) > 5 else 160
min_len = float(sys.argv[6]) if len(sys.argv) > 6 else 40
max_paths = int(sys.argv[7]) if len(sys.argv) > 7 else 140
eps = float(sys.argv[8]) if len(sys.argv) > 8 else 1.2
blur = int(sys.argv[9]) if len(sys.argv) > 9 else 5

img = cv2.imread(src)
h, w = img.shape[:2]
grey = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# Bilateral keeps architectural edges while flattening fabric, grain and texture.
clahe_clip = float(sys.argv[10]) if len(sys.argv) > 10 else 0
max_wiggle = float(sys.argv[11]) if len(sys.argv) > 11 else 0
if clahe_clip > 0:
    grey = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8)).apply(grey)
smooth = cv2.bilateralFilter(grey, 9, 40, 9)
smooth = cv2.GaussianBlur(smooth, (blur, blur), 0)
edges = cv2.Canny(smooth, low, high, L2gradient=True)

contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
items = []
for c in contours:
    length = cv2.arcLength(c, False)
    if length < min_len:
        continue
    approx = cv2.approxPolyDP(c, eps, False)
    pts = approx.reshape(-1, 2)
    if len(pts) < 2:
        continue
    if max_wiggle > 0 and len(pts) / length * 100 > max_wiggle:
        continue
    items.append((length, pts))

items.sort(key=lambda it: -it[0])
items = items[:max_paths]

def to_d(pts):
    head = f"M {pts[0][0]:.1f},{pts[0][1]:.1f}"
    rest = " ".join(f"L {x:.1f},{y:.1f}" for x, y in pts[1:])
    return f"{head} {rest}"

ds = [to_d(p) for _, p in items]

with open(out_ts, "w") as f:
    f.write("/**\n")
    f.write(f" * Exact edge-traced path data from public/home/source.jpg (viewBox 0 0 {w} {h}).\n")
    f.write(" * Do not hand-edit. Regenerate from the photo if it changes.\n")
    f.write(" */\n\n")
    f.write(f'export const SKETCH_RESOLVE_VIEWBOX = "0 0 {w} {h}" as const;\n\n')
    f.write("export const SKETCH_RESOLVE_PATHS: readonly string[] = [\n")
    f.write(",\n".join(f'  "{d}"' for d in ds))
    f.write("\n];\n")

with open(out_svg, "w") as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" style="background:#fff">\n')
    for d in ds:
        f.write(f'<path d="{d}" fill="none" stroke="#000" stroke-width="2"/>\n')
    f.write("</svg>\n")

total_pts = sum(len(p) for _, p in items)
print(f"{w}x{h} contours={len(contours)} kept={len(items)} points={total_pts}")
