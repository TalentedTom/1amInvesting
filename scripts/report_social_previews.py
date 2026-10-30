"""Generate crawler-readable share pages for the public PDF reports."""
import html
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageDraw, ImageFont

SITE = "https://www.1aminvesting.com"
MARKER = "<!-- Generated report share page. -->"
SAFE_TICKER = re.compile(r"[A-Za-z0-9.^=-]+\Z")


def _name(row, ticker):
    name = str(row.get("Name") or ticker).strip()
    return re.sub(r"\s*\(Equity MC, USD B\)\s*$", "", name)


def _render_cover(pdf, output, company, ticker):
    """Use the public report cover; a labeled card keeps missing Poppler non-blocking."""
    renderer = shutil.which("pdftoppm")
    if renderer:
        with tempfile.TemporaryDirectory() as temp:
            prefix = str(Path(temp) / "cover")
            result = subprocess.run(
                [renderer, "-f", "1", "-l", "1", "-singlefile",
                 "-scale-to-x", "600", "-scale-to-y", "-1", "-png",
                 str(pdf), prefix],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45,
            )
            if result.returncode == 0 and Path(prefix + ".png").exists():
                with Image.open(prefix + ".png") as source:
                    source = source.convert("RGB")
                    canvas = Image.new("RGB", (600, 600), "white")
                    canvas.paste(source.crop((0, 0, min(600, source.width),
                                              min(600, source.height))), (0, 0))
                    canvas.save(output, format="PNG", optimize=True)
                    return
    # A company-specific card also works when Poppler is unavailable.
    canvas = Image.new("RGB", (600, 600), "#0e1725")
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 44)
        small = ImageFont.truetype("arial.ttf", 26)
    except OSError:
        font = small = ImageFont.load_default()
    draw.text((38, 54), "1amInvesting  /  RESEARCH", fill="#9db3cc", font=small)
    # Wrap on words to avoid clipping long company names.
    lines, line = [], ""
    for word in company.split():
        candidate = (line + " " + word).strip()
        if line and draw.textlength(candidate, font=font) > 520:
            lines.append(line)
            line = word
        else:
            line = candidate
    lines.append(line)
    draw.multiline_text((38, 210), "\n".join(lines[:5]), fill="white",
                        font=font, spacing=12)
    draw.text((38, 490), ticker, fill="#59c7a8", font=small)
    canvas.save(output, format="PNG", optimize=True)


def _page(ticker, company, version):
    encoded = quote(ticker, safe=".-^=")
    url = f"{SITE}/r/{encoded}/"
    image = f"{url}cover.png?v={quote(version)}"
    title = f"{company} ({ticker}) | 1amInvesting Research"
    description = f"Read the {company} investment research report on 1amInvesting."
    esc = lambda value: html.escape(value, quote=True)
    target = "/?report=" + quote(ticker, safe="")
    js_target = json.dumps(target).replace("<", "\\u003c")
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{MARKER}
<meta name="report-version" content="{esc(version)}">
<title>{esc(title)}</title>
<link rel="canonical" href="{esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="1amInvesting">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(url)}">
<meta property="og:image" content="{esc(image)}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="{esc(company)} report cover">
<meta name="twitter:card" content="summary">
<meta name="twitter:creator" content="@TomSzczypka">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{esc(image)}">
<script>window.location.replace({js_target});</script>
</head><body><p><a href="{esc(target)}">Open {esc(company)} research</a></p></body></html>
'''


def generate_all(repo, manifest):
    repo = Path(repo)
    raw = (repo / "data.js").read_text(encoding="utf-8")
    data = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
    rows = {row["Ticker"]: row for row in data["en"] if row.get("Ticker")}
    root = repo / "r"
    root.mkdir(exist_ok=True)
    rendered = 0
    for ticker, entry in sorted(manifest.items()):
        if not SAFE_TICKER.fullmatch(ticker) or ticker in {".", ".."}:
            raise ValueError(f"Unsafe report ticker: {ticker!r}")
        if entry.get("format") != "pdf" or ticker not in rows:
            raise ValueError(f"Invalid public report: {ticker}")
        version = str(entry["version"])
        if not re.fullmatch(r"[0-9a-f]{16}", version):
            raise ValueError(f"Invalid report version: {ticker}")
        company = _name(rows[ticker], ticker)
        folder = root / ticker
        folder.mkdir(exist_ok=True)
        page, cover = folder / "index.html", folder / "cover.png"
        old = page.read_text(encoding="utf-8") if page.exists() else ""
        if MARKER not in old and old:
            raise ValueError(f"Refusing to replace an unmanaged page: {page}")
        if not cover.exists() or f'content="{version}"' not in old:
            _render_cover(repo / "deep-dives" / f"{ticker}.pdf", cover, company, ticker)
            rendered += 1
        content = _page(ticker, company, version)
        if content != old:
            page.write_text(content, encoding="utf-8", newline="\n")
    # Remove only share pages previously generated by this script.
    for folder in root.iterdir():
        if not folder.is_dir() or folder.name in manifest:
            continue
        page = folder / "index.html"
        if not page.exists() or MARKER not in page.read_text(encoding="utf-8"):
            continue
        page.unlink()
        cover = folder / "cover.png"
        if cover.is_file():
            cover.unlink()
        if not any(folder.iterdir()):
            folder.rmdir()
    print(f"Share pages: {len(manifest)}, covers refreshed: {rendered}")


if __name__ == "__main__":
    repo = Path(__file__).resolve().parent.parent
    manifest = json.loads((repo / "deep-dives" / "index.json").read_text(encoding="utf-8"))
    generate_all(repo, manifest)
