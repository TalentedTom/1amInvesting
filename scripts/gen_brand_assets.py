"""
Generate the site's brand image assets into /assets:

    favicon.png           64x64   — browser tab icon (accent-blue rounded
                                    square, white '1am' wordmark)
    apple-touch-icon.png  180x180 — iOS home-screen icon (iOS rounds the
                                    corners itself, so square canvas)
    og-card.png           1200x630 — Open Graph / Twitter share card:
                                    wordmark + tagline + a green sparkline
                                    nodding at the table's trajectory charts

Re-run whenever the brand changes:
    python scripts/gen_brand_assets.py

Fonts: uses Segoe UI Bold (always present on Windows), falling back to
Arial Bold. The deployed site uses Outfit, which isn't installed locally —
for icon-size marks the difference is invisible.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

ACCENT = (59, 130, 246)     # --accent
BG     = (10, 11, 16)       # --bg-dark
WHITE  = (255, 255, 255)
GREY   = (148, 163, 184)    # --text-secondary
SLATE  = (100, 116, 139)
GREEN  = (16, 185, 129)     # sparkline up-trend green

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\segoeuib.ttf",   # Segoe UI Bold
    r"C:\Windows\Fonts\arialbd.ttf",    # Arial Bold
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def centered_text(draw, canvas_w, canvas_h, text, fnt, fill, dy=0):
    """Draw text optically centered (bbox-corrected) on the canvas."""
    bbox = draw.textbbox((0, 0), text, font=fnt)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(
        ((canvas_w - w) / 2 - bbox[0], (canvas_h - h) / 2 - bbox[1] + dy),
        text, font=fnt, fill=fill,
    )


def make_favicon():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, 63, 63], radius=14, fill=ACCENT)
    centered_text(d, 64, 64, "1am", font(28), WHITE)
    img.save(ASSETS / "favicon.png")


def make_apple_touch():
    # iOS applies its own corner mask — supply a full-bleed square.
    img = Image.new("RGB", (180, 180), ACCENT)
    d = ImageDraw.Draw(img)
    centered_text(d, 180, 180, "1am", font(76), WHITE)
    img.save(ASSETS / "apple-touch-icon.png")


def make_og_card():
    img = Image.new("RGB", (1200, 630), BG)
    d = ImageDraw.Draw(img)
    # Thin accent bar across the top — echoes the site's accent usage.
    d.rectangle([0, 0, 1200, 8], fill=ACCENT)

    # Wordmark: '1am' white + 'Investing' accent, shared baseline.
    f_big = font(120)
    x, y = 84, 170
    d.text((x, y), "1am", font=f_big, fill=WHITE)
    w1 = d.textbbox((x, y), "1am", font=f_big)[2] - x
    d.text((x + w1 + 8, y), "Investing", font=f_big, fill=ACCENT)

    d.text((x + 6, y + 152),
           "Investing in the generational AI buildout",
           font=font(44), fill=GREY)
    d.text((x + 6, 556), "www.1aminvesting.com", font=font(30), fill=SLATE)

    # Rising sparkline, bottom-right — same visual language as the table's
    # trajectory column.
    pts = [(760, 520), (840, 468), (920, 487), (1000, 398), (1080, 338), (1148, 296)]
    d.line(pts, fill=GREEN, width=7, joint="curve")
    for px, py in pts:
        d.ellipse([px - 8, py - 8, px + 8, py + 8], fill=GREEN)

    img.save(ASSETS / "og-card.png")


if __name__ == "__main__":
    ASSETS.mkdir(exist_ok=True)
    make_favicon()
    make_apple_touch()
    make_og_card()
    print(f"Wrote favicon.png, apple-touch-icon.png, og-card.png -> {ASSETS}")
