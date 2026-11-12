// Kontrast nach WCAG 2.x. Wird von der Grundlagen-Seite und von der Prüfung benutzt.
const kanal = (wert) => {
  const c = wert / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

function helligkeit(hex) {
  const lang = hex.length === 4 ? [...hex.slice(1)].map((z) => z + z).join('') : hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(lang.slice(i, i + 2), 16));
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

export function kontrast(a, b) {
  const [hell, dunkel] = [helligkeit(a), helligkeit(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}

/** Liest die Farbtoken mit festem Hex-Wert aus dem Stylesheet. */
export function farbtoken(css) {
  return Object.fromEntries([...css.matchAll(/--az-([a-z-]+):\s*(#[0-9a-f]{3,6})\b/gi)].map((t) => [t[1], t[2]]));
}
