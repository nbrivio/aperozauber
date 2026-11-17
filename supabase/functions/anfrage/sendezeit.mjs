// Wann geht die Bestätigung an die Kundschaft hinaus?
// Regel: etwa 20 Minuten nach der Anfrage, nie vor 08:00 und nie ab 21:00 Schweizer Zeit.
// Fällt der Zeitpunkt aus dem Fenster, geht sie am nächsten Morgen kurz nach 08:00 hinaus.
// Die Streuung (18 bis 22 Minuten, am Morgen 3 bis 25 Minuten) lässt es nicht nach Uhrwerk aussehen.

const ZONE = 'Europe/Zurich';
const teile = (zeit) => {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(zeit));
  const w = Object.fromEntries(f.map((p) => [p.type, Number(p.value)]));
  return { j: w.year, m: w.month, t: w.day, h: w.hour, min: w.minute };
};

// Der Zeitpunkt, an dem es in Zürich genau h:min Uhr ist, am Tag j-m-t.
function zuerichUm(j, m, t, h, min) {
  for (const versatz of [1, 2]) {
    const zeit = Date.UTC(j, m - 1, t, h - versatz, min);
    const p = teile(zeit);
    if (p.h === h && p.min === min && p.t === t) return zeit;
  }
  throw new Error('Zeit nicht darstellbar');
}

export function sendezeit(eingang, { von = 8, bis = 21, zufall = Math.random } = {}) {
  const spanne = (a, b) => a + zufall() * (b - a);
  const kandidat = eingang + spanne(18, 22) * 60_000;
  const p = teile(kandidat);
  if (p.h >= von && p.h < bis) return kandidat;
  // Vor Öffnung: am selben Tag um 08:00. Ab 21 Uhr: am nächsten Tag.
  const tag = p.h < von ? Date.UTC(p.j, p.m - 1, p.t) : Date.UTC(p.j, p.m - 1, p.t) + 86_400_000;
  const d = new Date(tag);
  const morgen = zuerichUm(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), von, 0);
  return morgen + spanne(3, 25) * 60_000;
}
