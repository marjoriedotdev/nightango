"""Assemble le prototype Torch en une page : tokens du design system, composants, CSS et JS de l'app."""
import json
import re
import sys
from pathlib import Path

scratch = Path(sys.argv[1])
ds = scratch / "torchds" / "project"
proto = scratch / "proto"
out = scratch / "torch-prototype" / "torch-client.html"

tokens = json.loads((ds / "tokens.json").read_text(encoding="utf-8"))
OVERRIDE = {"accent-text", "accent-soft", "focus-ring"}


def theme_block(theme):
    lines = []
    for t in tokens["color"]["tokens"]:
        if t["name"] in OVERRIDE:
            continue
        v = t["value"]
        lines.append(f"--{t['name']}: {v[theme] if isinstance(v, dict) else v};")
    for t in tokens["shadow"]["tokens"]:
        v = t["value"]
        lines.append(f"--{t['name']}: {v[theme] if isinstance(v, dict) else v};")
    suffix = "d" if theme == "dark" else "l"
    lines.append(f"--accent-text: var(--accent-text-{suffix});")
    lines.append(f"--accent-soft: var(--accent-soft-{suffix});")
    lines.append(f"--focus-ring: var(--accent-text-{suffix});")
    return " ".join(lines)


static = []
for fam in ("spacing", "radius", "size"):
    for t in tokens[fam]["tokens"]:
        static.append(f"--{t['name']}: {t['value']};")
for key, stack in tokens["type"]["families"].items():
    static.append(f"--font-{key}: {stack};")
defaults = ("--accent-text-d: #f27a3f; --accent-text-l: #964c27; "
            "--accent-soft-d: rgba(242, 122, 63, 0.12); --accent-soft-l: rgba(242, 122, 63, 0.14);")

tokens_css = (
    "/* Torch tokens, dark first: generated from the Torch design system */\n"
    f":root {{ color-scheme: dark; {defaults} {' '.join(static)} {theme_block('dark')} }}\n"
    f"@media (prefers-color-scheme: light) {{ :root:not([data-theme=\"dark\"]) {{ color-scheme: light; {theme_block('light')} }} }}\n"
    f":root[data-theme=\"light\"] {{ color-scheme: light; {theme_block('light')} }}\n"
    f":root[data-theme=\"dark\"] {{ color-scheme: dark; {theme_block('dark')} }}\n"
)

bundle_js = (ds / "components" / "bundle.js").read_text(encoding="utf-8")
bundle_css = (ds / "components" / "bundle.css").read_text(encoding="utf-8")
app_css = (proto / "app.css").read_text(encoding="utf-8")
app_js = "\n".join((proto / f).read_text(encoding="utf-8") for f in ("core.js", "live.js", "views.js", "settings.js", "live-ui.js", "main.js"))
app_js = "(function () {\n'use strict';\n" + app_js + "\n})();\n"

for name, src in (("bundle", bundle_js), ("app", app_js)):
    if "</script" in src.lower():
        raise SystemExit(f"{name}: contient </script")

html = f"""<title>Torch Client</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
{tokens_css}
{bundle_css}
{app_css}
</style>
<div id="app"></div>
<noscript>Torch needs JavaScript to run.</noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1" crossorigin="anonymous"></script>
<script>
{bundle_js}
</script>
<script>
{app_js}
</script>
"""
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
(out.parent / "app.js").write_text(app_js, encoding="utf-8")
print(out, len(html))


# Userscript : même app, rendue dans un Shadow DOM au-dessus du client Torch
def shadow_css(css):
    for a, b in ((':root[data-theme="light"]', ':host([data-theme="light"])'), (':root[data-theme="dark"]', ':host([data-theme="dark"])'),
                 (':root:not([data-theme="dark"])', ':host(:not([data-theme="dark"]))'), (':root {', ':host {')):
        css = css.replace(a, b)
    return css

skin_app_css = app_css.replace("html,body{height:100%}", ":host{display:block;height:100%}", 1)
skin_app_css = skin_app_css.replace("body{background:var(--bg)", "#app{height:100%;background:var(--bg)", 1)
skin_app_css = skin_app_css.replace(".reduce-motion ", ":host(.reduce-motion) ").replace(".underline-links ", ":host(.underline-links) ")
skin_css = shadow_css(tokens_css) + "\n[hidden]{display:none!important}\n" + bundle_css + "\n" + skin_app_css
assert ":root" not in skin_css and "html,body{" not in skin_css
loader = (proto / "skin-loader.js").read_text(encoding="utf-8")
version = re.search(r"@version\s+(\S+)", loader).group(1)
page = (proto / "skin-page.js").read_text(encoding="utf-8")
page = page.replace("/*VERSION*/", version)
page = page.replace("/*CSS*/", json.dumps(skin_css)).replace("/*BUNDLE*/", bundle_js).replace("/*APP*/", app_js)
# Code de la page inséré comme littéral de chaîne, exécuté par un <script> en textContent (jamais analysé comme HTML).
loader = loader.replace("/*PAGE*/", json.dumps(page))
skin = out.parent / "torch-skin.user.js"
skin.write_text(loader, encoding="utf-8")
print(skin, len(loader))
