// Bewegung der Startseite: das Fenster im Auftakt, die Handschrift im Versprechen, der Bilderstapel.
// Fällt sie aus, zeigt die Seite ihre ruhige Fassung.

const wurzel = document.documentElement;
const begrenzt = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const weich = (x) => x * x * (3 - 2 * x);

function bewegung() {
  const buehne = document.querySelector('[data-buehne]');
  const stapel = document.querySelector('[data-stapel]');
  const kopf = document.querySelector('[data-kopf]');
  const blase = document.querySelector('[data-blase]');
  const claim = buehne.querySelector('.claim');
  const fenster = buehne.querySelector('.fenster');
  const rand = buehne.querySelector('.rand');
  const satz = document.querySelector('[data-satz] .innen > .hand');
  const zeile = stapel.querySelector('.zeile');
  const bilder = [...stapel.querySelectorAll('.karten img')];
  const legenden = [...stapel.querySelectorAll('.legenden p')];
  let offen = false;
  let aktiv = 0;

  // Das Fenster ist kein Kreis, sondern wie von Hand ausgeschnitten: ein Kreis mit ein paar weichen Wellen.
  const schnitt = (() => {
    const punkte = 110;
    const wellen = [[2, 0.085, 1.1], [3, 0.06, 0.4], [4, 0.032, 2.3], [5, 0.02, 4.0], [7, 0.01, 0.9]];
    const form = Array.from({ length: punkte }, (_, i) => {
      const winkel = (i / punkte) * Math.PI * 2;
      return [winkel, wellen.reduce((r, [n, hub, phase]) => r + hub * Math.sin(n * winkel + phase), 1)];
    });
    return (cx, cy, radius, dreh, plus) =>
      `polygon(${form
        .map(([winkel, faktor]) => {
          const d = radius * faktor + plus;
          return `${(cx + Math.cos(winkel + dreh) * d).toFixed(1)}px ${(cy + Math.sin(winkel + dreh) * d).toFixed(1)}px`;
        })
        .join(',')})`;
  })();

  const fortschritt = (element, vh) => {
    const r = element.getBoundingClientRect();
    return begrenzt(-r.top / (r.height - vh));
  };

  function zeichnen() {
    offen = false;
    const vh = window.innerHeight;
    const vw = document.documentElement.clientWidth;

    // Auftakt: Fenster auf, Einladung weg, Kopf und Titel da.
    const p = fortschritt(buehne, vh);
    const auf = weich(begrenzt(p / 0.45));
    buehne.style.setProperty('--auf', auf.toFixed(4));
    buehne.style.setProperty('--weg', begrenzt(p / 0.14).toFixed(3));
    buehne.style.setProperty('--nah', weich(begrenzt((p - 0.35) / 0.65)).toFixed(4));
    claim.style.opacity = begrenzt((p - 0.5) / 0.12).toFixed(3);
    kopf.style.setProperty('--t', weich(begrenzt(p / 0.16)).toFixed(3));
    blase.classList.toggle('an', p > 0.08);
    const radius = 0.17 * Math.min(vw, vh) + auf * 1.5 * Math.max(vw, vh);
    fenster.style.clipPath = schnitt(vw * 0.5, vh * 0.53, radius, auf * 0.5, 0);
    rand.style.clipPath = schnitt(vw * 0.5, vh * 0.53, radius, auf * 0.5, 7);

    // Versprechen: die Handschrift zieht von rechts an ihren Platz.
    const s = satz.getBoundingClientRect();
    satz.style.setProperty('--zug', (Math.max(0, s.top - vh * 0.5) * 0.14).toFixed(1));

    // Stapel: die Zeile zieht durch, die Bilder legen sich aufeinander.
    const q = fortschritt(stapel, vh);
    zeile.style.setProperty('--x', `${(vw * 0.7 - q * (zeile.scrollWidth + vw * 0.2)).toFixed(1)}px`);
    let oben = 0;
    bilder.forEach((bild, i) => {
      if (i === 0) return;
      const t = weich(begrenzt((q - (0.12 + (i - 1) * 0.25)) / 0.2));
      bild.style.setProperty('--q', t.toFixed(4));
      if (t > 0.6) oben = i;
    });
    if (oben !== aktiv) {
      legenden[aktiv].classList.remove('an');
      legenden[oben].classList.add('an');
      aktiv = oben;
    }
  }

  const anstossen = () => {
    if (offen) return;
    offen = true;
    requestAnimationFrame(zeichnen);
  };
  addEventListener('scroll', anstossen, { passive: true });
  addEventListener('resize', anstossen);
  addEventListener('load', anstossen);
  zeichnen();
}

if (wurzel.classList.contains('bewegt')) {
  try {
    bewegung();
  } catch (fehler) {
    wurzel.classList.remove('bewegt');
    console.error(fehler);
  }
}
