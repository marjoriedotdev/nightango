"""Passe les artboards sombres codés en dur sur des variables de thème (dark/light)."""
import re
import sys
from pathlib import Path

VARS = (
    "--accent: {{accent}}; --accent-soft: {{accentSoft}}; --accent-text: {{accentText}}; "
    "--bg: {{t.bg}}; --sidebar: {{t.sidebar}}; --panel: {{t.panel}}; --subtle: {{t.subtle}}; "
    "--hover: {{t.hover}}; --hover-2: {{t.hover2}}; --raised: {{t.raised}}; --selected: {{t.selected}}; "
    "--border: {{t.border}}; --border-strong: {{t.borderStrong}}; --divider: {{t.divider}}; "
    "--control: {{t.control}}; --control-strong: {{t.controlStrong}}; --track: {{t.track}}; "
    "--thumb: {{t.thumb}}; --knob: {{t.knob}}; --text: {{t.text}}; --text-body: {{t.body}}; "
    "--text-2: {{t.text2}}; --text-3: {{t.text3}}; --danger: {{t.danger}}; "
    "--shadow: {{t.shadow}}; --shadow-lg: {{t.shadowLg}}; "
)

SPECIAL = [
    ("body{margin:0;background:#16171A}", "body{margin:0}"),
    ("border-radius:50%;background:#ECEDEF;transition", "border-radius:50%;background:var(--knob);transition"),
    ("border-radius: 9px; background: #1D1F23", "border-radius: 9px; background: var(--track)"),
    ("0 8px 24px rgba(0,0,0,0.4)", "var(--shadow-lg)"),
    ("a:hover{color:#FFFFFF}", "a:hover{color:var(--text)}"),
]

COLORS = {
    "#16171A": "var(--bg)",
    "#111214": "var(--sidebar)",
    "#131417": "var(--panel)",
    "#1A1B1F": "var(--subtle)",
    "#1B1C20": "var(--subtle)",
    "#1C1D21": "var(--hover)",
    "#1F2125": "var(--hover-2)",
    "#1D1F23": "var(--raised)",
    "#23252A": "var(--selected)",
    "#2A2C31": "var(--thumb)",
    "#26282E": "var(--border)",
    "#2E3036": "var(--border-strong)",
    "#202226": "var(--divider)",
    "#3A3D44": "var(--control)",
    "#4A4D55": "var(--control-strong)",
    "#ECEDEF": "var(--text)",
    "#D6D8DC": "var(--text-body)",
    "#A6A9B0": "var(--text-2)",
    "#8A8E96": "var(--text-3)",
    "#F08A8A": "var(--danger)",
}

METHODS = """  __parse(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h.slice(0, 6), 16);
    if (isNaN(n)) n = 0xF27A3F;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  __rgba(hex, alpha) {
    var c = this.__parse(hex);
    return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + alpha + ')';
  }
  __darken(hex, factor) {
    var c = this.__parse(hex).map(function (v) { return Math.round(v * factor); });
    return 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')';
  }
  __tk(light) {
    return light ? {
      bg: '#FFFFFF', sidebar: '#F6F6F7', panel: '#FAFAFA', subtle: '#F4F4F6', hover: '#EDEDF0', hover2: '#EBEBEE',
      raised: '#FFFFFF', selected: '#E6E6EA', border: '#E4E4E8', borderStrong: '#D9D9DE', divider: '#EEEEF1',
      control: '#C9CBD1', controlStrong: '#A9ACB4', track: '#EDEDF0', thumb: '#FFFFFF', knob: '#FFFFFF',
      text: '#17181B', body: '#2A2C31', text2: '#5C606A', text3: '#6B6F78', danger: '#C93C3C',
      shadow: '0 4px 12px rgba(16, 17, 20, 0.10)', shadowLg: '0 8px 24px rgba(16, 17, 20, 0.12)'
    } : {
      bg: '#16171A', sidebar: '#111214', panel: '#131417', subtle: '#1A1B1F', hover: '#1C1D21', hover2: '#1F2125',
      raised: '#1D1F23', selected: '#23252A', border: '#26282E', borderStrong: '#2E3036', divider: '#202226',
      control: '#3A3D44', controlStrong: '#4A4D55', track: '#1D1F23', thumb: '#2A2C31', knob: '#ECEDEF',
      text: '#ECEDEF', body: '#D6D8DC', text2: '#A6A9B0', text3: '#8A8E96', danger: '#F08A8A',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.35)', shadowLg: '0 8px 24px rgba(0, 0, 0, 0.4)'
    };
  }
"""


def tokenize(path: Path) -> None:
    src = path.read_text(encoding="utf-8")
    marker = '<script type="text/x-dc" data-dc-script'
    cut = src.index(marker)
    markup, script = src[:cut], src[cut:]

    for old, new in SPECIAL:
        markup = markup.replace(old, new)
    markup, count = re.subn(r"--accent: \{\{accent\}\};( --accent-soft: \{\{accentSoft\}\};)? ", VARS, markup, count=1)
    if count != 1:
        raise SystemExit(f"{path.name}: racine introuvable")
    for hex_value, var in COLORS.items():
        markup = re.sub(re.escape(hex_value), var, markup, flags=re.IGNORECASE)

    script = script.replace("data-props='{", "data-props='{\"theme\":{\"editor\":\"enum\",\"options\":[\"dark\",\"light\"],\"default\":\"dark\"},", 1)
    script = script.replace("'background: #2A2C31; color: #ECEDEF'", "'background: var(--thumb); color: var(--text); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12)'")
    script = script.replace("'color: #8A8E96'", "'color: var(--text-3)'")
    script = script.replace("  renderVals() {", METHODS + "  renderVals() {\n    var __light = (this.props.theme ?? 'dark') === 'light';\n    var __accent = this.props.accent ?? '#F27A3F';", 1)
    extra = "t: this.__tk(__light), accentText: __light ? this.__darken(__accent, 0.62) : __accent, "
    if "accentSoft:" not in script:
        extra += "accentSoft: this.__rgba(__accent, __light ? 0.14 : 0.12), "
    last = script.rindex("return {")
    script = script[:last] + "return { " + extra + script[last + len("return {"):]

    leftovers = sorted(set(h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}\b", markup)) & set(COLORS))
    if leftovers:
        raise SystemExit(f"{path.name}: couleurs restantes {leftovers}")
    path.write_text(markup + script, encoding="utf-8")
    print(f"{path.name}: ok")


for name in sys.argv[2:]:
    tokenize(Path(sys.argv[1]) / name)
