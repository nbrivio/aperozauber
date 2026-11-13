// Bewegung der Startseite und die Vorschau der Anfrage. Ohne dieses Skript bleibt die Seite
// vollständig lesbar: Die Bewegung ist Zugabe, die Anfrage geht auch direkt per E-Mail.

const wurzel = document.documentElement;
const begrenzt = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const weich = (x) => x * x * (3 - 2 * x);

function bewegung() {
  const buehne = document.querySelector('[data-buehne]');
  const stapel = document.querySelector('[data-stapel]');
  const kopf = document.querySelector('[data-kopf]');
  const schweb = document.querySelector('[data-schweb]');
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
    schweb.classList.toggle('an', p > 0.08);
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

function anfrage() {
  const formular = document.querySelector('[data-anfrage]');
  const vorschau = formular.querySelector('[data-vorschau]');
  const adresse = formular.getAttribute('action');
  let ziel = adresse;
  const feld = (name) => formular.elements[name].value.trim();

  function nachricht() {
    const fuer = formular.querySelector('[name=fuer]:checked').value;
    const posten = [...formular.querySelectorAll('[data-p]')]
      .filter((eingabe) => Number(eingabe.value) > 0)
      .map((eingabe) => `${eingabe.value} × ${eingabe.dataset.p}${eingabe.dataset.g ? ` ${eingabe.dataset.g}` : ''}`);
    const datum = feld('wann').split('-').reverse().join('.');
    const zeilen = ['Hallo Sibylle, ich möchte einen Apéro anfragen.'];
    if (feld('name')) zeilen.push(`Name: ${feld('name')}`);
    zeilen.push(`Für: ${fuer}`);
    zeilen.push(`Bestellung: ${posten.length ? `\n- ${posten.join('\n- ')}` : 'noch offen'}`);
    zeilen.push(`Gäste: ${feld('wieviele') || 'noch offen'}`);
    zeilen.push(`Datum: ${datum || 'noch offen'}`);
    zeilen.push(`Ort: ${feld('wo') || 'noch offen'}`);
    if (feld('wuensche')) zeilen.push(`Wünsche und Allergien: ${feld('wuensche')}`);
    const text = zeilen.join('\n');
    vorschau.textContent = text;
    ziel = `${adresse}?subject=${encodeURIComponent(`Apéro-Anfrage (${fuer})`)}&body=${encodeURIComponent(text)}`;
  }

  formular.addEventListener('input', nachricht);
  formular.addEventListener('change', nachricht);
  formular.addEventListener('submit', (ereignis) => {
    ereignis.preventDefault();
    location.href = ziel;
  });
  for (const knopf of document.querySelectorAll('[data-fuer]')) {
    knopf.addEventListener('click', () => {
      formular.querySelector(`[name=fuer][value="${knopf.dataset.fuer}"]`).checked = true;
      nachricht();
    });
  }
  formular.querySelector('[data-ankunft]').hidden = false;
  nachricht();
}

// Ein Verweis auf einen Abschnitt im Rechtlichen klappt ihn auf.
function aufklappen() {
  const ziel = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (ziel && ziel.tagName === 'DETAILS') {
    ziel.open = true;
    ziel.scrollIntoView();
  }
}

if (wurzel.classList.contains('bewegt')) {
  try {
    bewegung();
    wurzel.dataset.laeuft = '1';
  } catch (fehler) {
    // Die ruhige Fassung übernimmt, die Anfrage läuft trotzdem.
    wurzel.classList.remove('bewegt');
    console.error(fehler);
  }
}
anfrage();
addEventListener('hashchange', aufklappen);
aufklappen();
