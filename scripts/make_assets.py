"""Render Anchor brand assets (navy anchor + mustard crossbar) deterministically.

Run: python3 scripts/make_assets.py
"""
from PIL import Image, ImageDraw

NAVY = (22, 40, 63, 255)      # #16283F
GOLD = (201, 154, 59, 255)   # #C99A3B
CREAM = (247, 242, 232, 255)  # #F7F2E8
WHITE = (255, 255, 255, 255)


def draw_anchor(img, shank_color=NAVY, bar_color=GOLD, scale=1.0):
    """Draw anchor centered in a 1024-base coordinate system."""
    d = ImageDraw.Draw(img)
    S = img.size[0] / 1024.0
    cx = img.size[0] / 2.0

    def X(v):
        return cx + v * S * scale

    def Y(v):
        return v * S * scale + (img.size[1] - 1024 * S * scale) / 2.0

    def W(v):
        return v * S * scale

    # Ring (crown)
    r = 92
    w = W(54)
    d.ellipse([X(-r) - w / 2, Y(212 - r) - w / 2, X(r) + w / 2, Y(212 + r) + w / 2],
              outline=shank_color, width=int(w))
    # Shank
    d.rounded_rectangle([X(-29), Y(300), X(29), Y(806)], radius=W(29), fill=shank_color)
    # Crossbar (mustard/gold stock)
    d.rounded_rectangle([X(-244), Y(398), X(244), Y(444)], radius=W(23), fill=bar_color)
    # Arms (arc) — circle centered (0, 512), radius 292, bottom sweep
    r2 = 292
    w2 = W(56)
    d.arc([X(-r2) - w2 / 2, Y(512 - r2) - w2 / 2, X(r2) + w2 / 2, Y(512 + r2) + w2 / 2],
          start=34, end=146, fill=shank_color, width=int(w2))
    # Flukes (arrow wedges at arm tips)
    left = [(X(-248), Y(661)), (X(-316), Y(566)), (X(-196), Y(580))]
    right = [(X(248), Y(661)), (X(316), Y(566)), (X(196), Y(580))]
    d.polygon(left, fill=shank_color)
    d.polygon(right, fill=shank_color)
    return img


def canvas(size, bg):
    return Image.new("RGBA", (size, size), bg)


if __name__ == "__main__":
    # App icon — full-bleed cream, anchor at 78%
    icon = draw_anchor(canvas(1024, CREAM), scale=0.78)
    icon.convert("RGB").save("assets/icon.png")

    # Splash icon — generous padding
    splash = draw_anchor(canvas(1024, CREAM), scale=0.5)
    splash.convert("RGB").save("assets/splash-icon.png")

    # Favicon 48px
    fav = draw_anchor(canvas(48, CREAM), scale=0.86)
    fav.convert("RGB").save("assets/favicon.png")

    # Android adaptive foreground — transparent, ~50% (safe zone)
    fg = draw_anchor(canvas(1024, (0, 0, 0, 0)), scale=0.5)
    fg.save("assets/android-icon-foreground.png")

    # Android background — solid cream
    canvas(1024, CREAM).convert("RGB").save("assets/android-icon-background.png")

    # Monochrome — white silhouette
    mono = draw_anchor(canvas(1024, (0, 0, 0, 0)), shank_color=WHITE, bar_color=WHITE, scale=0.52)
    mono.save("assets/android-icon-monochrome.png")

    print("assets written")
