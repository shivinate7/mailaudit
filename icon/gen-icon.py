#!/usr/bin/env python3
"""Regenerates icon/apple-touch-icon.svg — the 1024x1024 master for the
home-screen and browser icons.

Standalone: Python 3 stdlib only, no dependencies. NOT part of `npm run build`
or `npm test` — nothing runs this automatically. It exists so the icon stays
editable; the shipped PNGs are flattened exports and cannot be re-cut without it.

    python3 icon/gen-icon.py          # rewrites icon/apple-touch-icon.svg

To re-export the PNGs after changing this file (macOS, needs Chrome):

    cd icon
    printf '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;\\
    padding:0;background:#EEE5F8}img{display:block;width:1024px;height:1024px}\\
    </style><img src="apple-touch-icon.svg">' > /tmp/export.html
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \\
      --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \\
      --window-size=1024,1024 --screenshot=/tmp/master-1024.png \\
      "file:///tmp/export.html"
    sips -z 180 180 /tmp/master-1024.png --out ../apple-touch-icon.png

And the favicon PNG fallback, which comes from favicon.svg — NOT from the
master — and must keep its transparency, so pass a transparent backdrop:

    printf '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;\
    padding:0;background:transparent}img{display:block;width:512px;height:512px}\
    </style><img src="file://ABSOLUTE/PATH/TO/favicon.svg">' > /tmp/fav.html
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
      --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
      --default-background-color=00000000 --window-size=512,512 \
      --screenshot=/tmp/fav-512.png "file:///tmp/fav.html"
    sips -z 32 32 /tmp/fav-512.png --out ../icon-32.png

The img src must be ABSOLUTE — a relative one resolves against /tmp and renders
a blank PNG that looks like a successful export.

Render at 1024 and downsample — rendering straight to 180 loses the guilloche
to aliasing instead of averaging it. Chrome emits an opaque PNG with no alpha
channel, which is what apple-touch-icon wants.

DESIGN (approved after six review rounds; see the git history of this file)
  Art-nouveau brooch: gold setting, eight scroll lobes with violet cabochons,
  faceted emerald jewel, engine-turned guilloche field on a cool violet ground.
  The emerald is deliberate - violet and green are near-complementary, so the
  violet surround makes the emerald read MORE green, not less.

CONSTRAINTS (Apple HIG - do not break these)
  - Opaque, full-bleed square. Never pre-round the corners; iOS masks its own
    squircle and a baked radius shows as a dark halo.
  - No text. Focal element ~50-70% of canvas.
  - Anything that must survive downscaling needs >=3% of canvas width. The gold
    ring and the jewel carry the silhouette; the guilloche is texture that is
    expected to average away below ~60px.
"""
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "apple-touch-icon.svg")
C = 512.0

# --- palette ---------------------------------------------------------------
GOLD, GOLDL, GOLDD = "#C9A961", "#F0DFAF", "#987936"
VIO, VIOL, VIOD = "#7B6BA8", "#BBADDD", "#4E4272"
# ground: level 2 of the approved ladder ("high") - the point at which the icon
# reads as violet at a glance without tipping into candy.
G1, G2, G3 = "#EEE5F8", "#D2C1EA", "#A992D0"
FIELD = "#8B76B4"

GRAIN = ('<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" '
         'numOctaves="4" stitchTiles="stitch"/>'
         '<feColorMatrix type="saturate" values="0"/></filter>')
GRAIN_RECT = ('<rect width="1024" height="1024" filter="url(#grain)" opacity="0.10" '
              'style="mix-blend-mode:multiply"/>')

DEFS = (
    f'<linearGradient id="brassg" x1="0.12" y1="0" x2="0.88" y2="1">'
    f'<stop offset="0" stop-color="{GOLDL}"/><stop offset="0.38" stop-color="{GOLD}"/>'
    f'<stop offset="0.58" stop-color="{GOLDL}"/><stop offset="1" stop-color="{GOLDD}"/>'
    f'</linearGradient>'
    f'<radialGradient id="jewel" cx="34%" cy="28%" r="82%">'
    f'<stop offset="0" stop-color="#87DEBB"/><stop offset="0.42" stop-color="#37A37E"/>'
    f'<stop offset="1" stop-color="#175540"/></radialGradient>'
    f'<radialGradient id="viog" cx="36%" cy="30%" r="80%">'
    f'<stop offset="0" stop-color="{VIOL}"/><stop offset="0.5" stop-color="{VIO}"/>'
    f'<stop offset="1" stop-color="{VIOD}"/></radialGradient>'
    f'<filter id="sh" x="-35%" y="-35%" width="170%" height="170%">'
    f'<feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#4E4272" '
    f'flood-opacity="0.30"/></filter>'
    f'<filter id="shs" x="-45%" y="-45%" width="190%" height="190%">'
    f'<feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#4E4272" '
    f'flood-opacity="0.26"/></filter>')


def rays(cx, cy, r0, r1, n, color, wM=3.0, wm=1.2, op=0.55):
    """Radiating hairlines. Alternating weights keep it from moire-ing."""
    return "".join(
        f'<line x1="{cx + r0*math.cos(i/n*2*math.pi):.1f}" '
        f'y1="{cy + r0*math.sin(i/n*2*math.pi):.1f}" '
        f'x2="{cx + r1*math.cos(i/n*2*math.pi):.1f}" '
        f'y2="{cy + r1*math.sin(i/n*2*math.pi):.1f}" stroke="{color}" '
        f'stroke-width="{wM if i % 2 == 0 else wm}" opacity="{op}" stroke-linecap="round"/>'
        for i in range(n))


def guilloche(cx, cy, r, lobes, amp, color, w=1.5, op=0.45, steps=520, phase=0.0):
    """Engine-turned rosette, as on a banknote or a watch dial. Fine enough to
    stay airy at full size and to dissolve gracefully rather than clog small."""
    pts = []
    for i in range(steps + 1):
        t = i / steps * 2 * math.pi
        rr = r + amp * math.sin(lobes * t + phase)
        pts.append(f"{cx + rr*math.cos(t):.1f},{cy + rr*math.sin(t):.1f}")
    return (f'<path d="M{"L".join(pts)}Z" fill="none" stroke="{color}" stroke-width="{w}" '
            f'opacity="{op}"/>')


def field():
    """Everything behind the brooch."""
    out = [rays(C, C, 356, 500, 96, FIELD, 3.0, 1.2, 0.58),
           guilloche(C, C, 430, 36, 13, FIELD, 1.5, 0.48),
           guilloche(C, C, 396, 36, 13, FIELD, 1.2, 0.34, phase=math.pi / 36),
           f'<circle cx="{C}" cy="{C}" r="470" fill="none" stroke="{FIELD}" '
           f'stroke-width="2.5" opacity="0.42"/>',
           f'<circle cx="{C}" cy="{C}" r="352" fill="none" stroke="{FIELD}" '
           f'stroke-width="4" opacity="0.58"/>']
    return "".join(out)


def brooch():
    """The jewel itself. Held byte-identical while the ground was chosen, so
    treat it as settled - change the ground first if the icon needs tuning."""
    b = []
    # eight scroll lobes, each with a violet cabochon
    for i in range(8):
        a = i / 8 * 2 * math.pi - math.pi / 2
        lx, ly = C + 322 * math.cos(a), C + 322 * math.sin(a)
        rot = math.degrees(a) + 90
        b.append(f'<g transform="translate({lx:.1f},{ly:.1f}) rotate({rot:.1f})" '
                 f'filter="url(#shs)">'
                 f'<path d="M0,-70 C40,-70 64,-38 64,-2 C64,34 34,58 0,58 '
                 f'C-34,58 -64,34 -64,-2 C-64,-38 -40,-70 0,-70 Z" fill="url(#brassg)"/>'
                 f'<path d="M0,-44 C25,-44 40,-25 40,-1 C40,21 23,38 0,38 '
                 f'C-23,38 -40,21 -40,-1 C-40,-25 -25,-44 0,-44 Z" fill="none" '
                 f'stroke="{GOLDD}" stroke-width="4" opacity="0.7"/>'
                 f'<circle cx="0" cy="-2" r="15" fill="url(#viog)"/>'
                 f'<circle cx="-4" cy="-7" r="6" fill="{VIOL}" opacity="0.85"/></g>')
    # gold setting
    b.append(f'<g filter="url(#sh)"><circle cx="{C}" cy="{C}" r="312" fill="url(#brassg)"/></g>')
    b.append(f'<circle cx="{C}" cy="{C}" r="312" fill="none" stroke="{GOLDD}" stroke-width="6"/>')
    b.append(f'<circle cx="{C}" cy="{C}" r="286" fill="none" stroke="{GOLDD}" '
             f'stroke-width="3" opacity="0.75"/>')
    b.append(guilloche(C, C, 274, 40, 8, GOLDD, 2.0, 0.5))
    for i in range(32):
        a = i / 32 * 2 * math.pi
        b.append(f'<path d="M{C + 246*math.cos(a):.1f},{C + 246*math.sin(a):.1f} '
                 f'Q{C + 292*math.cos(a+0.02):.1f},{C + 292*math.sin(a+0.02):.1f} '
                 f'{C + 296*math.cos(a+0.075):.1f},{C + 296*math.sin(a+0.075):.1f}" '
                 f'fill="none" stroke="{GOLDD}" stroke-width="3" opacity="0.5"/>')
    # bezel and jewel
    b.append(f'<circle cx="{C}" cy="{C}" r="234" fill="{GOLDD}"/>')
    b.append(f'<circle cx="{C}" cy="{C}" r="220" fill="{GOLDL}" opacity="0.55"/>')
    b.append(f'<circle cx="{C}" cy="{C}" r="208" fill="url(#jewel)"/>')
    n = 12
    for i in range(n):
        a1 = i / n * 2 * math.pi - math.pi / 2
        a2 = (i + 1) / n * 2 * math.pi - math.pi / 2
        lit = i in (9, 10, 11, 0)  # light falls from the upper left
        b.append(f'<path d="M{C},{C} L{C+208*math.cos(a1):.1f},{C+208*math.sin(a1):.1f} '
                 f'L{C+208*math.cos(a2):.1f},{C+208*math.sin(a2):.1f} Z" '
                 f'fill="{"#B9F2DC" if lit else "#0E4433"}" '
                 f'opacity="{0.34 if lit else 0.16}"/>')
    b.append(f'<circle cx="{C}" cy="{C}" r="102" fill="#37A37E" opacity="0.55"/>')
    b.append(f'<circle cx="{C}" cy="{C}" r="102" fill="none" stroke="#0E4433" '
             f'stroke-width="5" opacity="0.5"/>')
    for i in range(n):
        a = i / n * 2 * math.pi - math.pi / 2
        b.append(f'<line x1="{C+102*math.cos(a):.1f}" y1="{C+102*math.sin(a):.1f}" '
                 f'x2="{C+208*math.cos(a):.1f}" y2="{C+208*math.sin(a):.1f}" '
                 f'stroke="#0E4433" stroke-width="3.5" opacity="0.4"/>')
    # specular highlights
    b.append(f'<ellipse cx="{C-66}" cy="{C-80}" rx="60" ry="38" fill="#DDFBF0" '
             f'opacity="0.42" transform="rotate(-38 {C-66} {C-80})"/>')
    b.append(f'<ellipse cx="{C-32}" cy="{C-42}" rx="21" ry="12" fill="#fff" '
             f'opacity="0.55" transform="rotate(-38 {C-32} {C-42})"/>')
    return "".join(b)



# ---------------------------------------------------------------------------
# The favicon is a DIFFERENT drawing, not the master shrunk.
#
# A browser tab renders it at 16 CSS px. The master is a scene — a brooch
# sitting on a violet ground — and at 16px the ground eats most of the frame
# while the mark itself lands around 10px. Next to a favicon that fills its
# box it reads as small and washed out.
#
# So: no ground (transparent, which favicons allow and apple-touch-icon does
# not), and the mark scaled until the lobes touch the edge. Everything that
# only exists to be seen large is cut — the guilloche, the 32 scroll marks,
# the engine-turned field. What survives is what still reads at 16px: a gold
# ring, eight lobes, an emerald centre.
# ---------------------------------------------------------------------------

FAVICON_OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "favicon.svg"
)


def favicon_svg():
    """Full-bleed, transparent, radically simplified. 100-unit viewBox."""
    lobes = []
    for i in range(8):
        a = i / 8 * 2 * math.pi - math.pi / 2
        x, y = 50 + 42 * math.cos(a), 50 + 42 * math.sin(a)
        lobes.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="8.4" fill="url(#fg)"/>'
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="8.4" fill="none" '
            f'stroke="{GOLDD}" stroke-width="1.1" opacity=".85"/>'
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3.4" fill="{VIOD}"/>'
        )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
        'width="100" height="100">'
        '<defs>'
        f'<linearGradient id="fg" x1=".12" y1="0" x2=".88" y2="1">'
        f'<stop offset="0" stop-color="{GOLDL}"/><stop offset=".38" stop-color="{GOLD}"/>'
        f'<stop offset=".58" stop-color="{GOLDL}"/><stop offset="1" stop-color="{GOLDD}"/>'
        f'</linearGradient>'
        f'<radialGradient id="fj" cx="34%" cy="28%" r="82%">'
        f'<stop offset="0" stop-color="#87DEBB"/><stop offset=".42" stop-color="#37A37E"/>'
        f'<stop offset="1" stop-color="#175540"/></radialGradient>'
        '</defs>'
        + "".join(lobes)
        + f'<circle cx="50" cy="50" r="40" fill="url(#fg)"/>'
        + f'<circle cx="50" cy="50" r="40" fill="none" stroke="{GOLDD}" stroke-width="2"/>'
        + f'<circle cx="50" cy="50" r="29" fill="{GOLDD}"/>'
        + f'<circle cx="50" cy="50" r="27" fill="url(#fj)"/>'
        + '<ellipse cx="41" cy="40" rx="8.5" ry="5.5" fill="#DDFBF0" opacity=".45" '
          'transform="rotate(-38 41 40)"/>'
        + "</svg>"
    )


def render():
    ground = (f'<radialGradient id="bgg" cx="50%" cy="42%" r="76%">'
              f'<stop offset="0" stop-color="{G1}"/><stop offset="0.58" stop-color="{G2}"/>'
              f'<stop offset="1" stop-color="{G3}"/></radialGradient>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" '
            f'height="1024"><defs>{GRAIN}{DEFS}{ground}</defs>'
            f'<rect width="1024" height="1024" fill="url(#bgg)"/>'
            f'{field()}{brooch()}{GRAIN_RECT}</svg>')


if __name__ == "__main__":
    svg = render()
    with open(OUT, "w") as f:
        f.write(svg)
    print(f"wrote {OUT} ({len(svg)} bytes)")
    fav = favicon_svg()
    with open(FAVICON_OUT, "w") as f:
        f.write(fav)
    print(f"wrote {FAVICON_OUT} ({len(fav)} bytes)")
