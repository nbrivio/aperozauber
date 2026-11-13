// Bewegung der Startseite und das Bestellfenster. Ohne dieses Skript bleibt die Seite
// vollständig lesbar: Die Bewegung ist Zugabe, das Formular steht dann im Kapitel Anfrage.

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

function anfrage() {
  const formular = document.querySelector('[data-anfrage]');
  const fenster = document.querySelector('[data-fenster]');
  const platz = fenster.querySelector('[data-fensterplatz]');
  const vorschau = formular.querySelector('[data-vorschau]');
  const meldung = formular.querySelector('[data-meldung]');
  const texte = JSON.parse(formular.dataset.meldungen);
  const ziel = formular.dataset.ziel;
  const adresse = formular.getAttribute('action');
  const geladen = Date.now();
  const feld = (name) => formular.elements[name].value.trim();
  const mengen = () => [...formular.querySelectorAll('[data-p]')];

  function angaben() {
    const posten = mengen()
      .filter((eingabe) => Number(eingabe.value) > 0)
      .map((eingabe) => ({ anzahl: Number(eingabe.value), kreation: eingabe.dataset.p, groesse: eingabe.dataset.g }));
    return {
      name: feld('name'),
      kontakt: feld('kontakt'),
      fuer: formular.querySelector('[name=fuer]:checked').value,
      posten,
      gaeste: feld('wieviele'),
      datum: feld('wann').split('-').reverse().join('.'),
      ort: feld('wo'),
      wuensche: feld('wuensche'),
    };
  }

  function nachricht(a) {
    const zeilen = ['Hallo Sibylle, ich möchte einen Apéro anfragen.'];
    if (a.name) zeilen.push(`Name: ${a.name}`);
    if (a.kontakt) zeilen.push(`Antwort an: ${a.kontakt}`);
    zeilen.push(`Für: ${a.fuer}`);
    const liste = a.posten.map((p) => `${p.anzahl} × ${p.kreation}${p.groesse ? ` ${p.groesse}` : ''}`);
    zeilen.push(`Bestellung: ${liste.length ? `\n- ${liste.join('\n- ')}` : 'noch offen'}`);
    zeilen.push(`Gäste: ${a.gaeste || 'noch offen'}`);
    zeilen.push(`Datum: ${a.datum || 'noch offen'}`);
    zeilen.push(`Ort: ${a.ort || 'noch offen'}`);
    if (a.wuensche) zeilen.push(`Wünsche und Allergien: ${a.wuensche}`);
    return zeilen.join('\n');
  }

  function auffrischen() {
    for (const eingabe of mengen()) eingabe.closest('.menge').classList.toggle('gewaehlt', Number(eingabe.value) > 0);
    vorschau.textContent = nachricht(angaben());
  }

  function melde(text, fehler = false) {
    meldung.textContent = text;
    meldung.classList.toggle('fehler', fehler);
  }

  function danke(text) {
    const dank = fenster.querySelector('[data-dank]').content.cloneNode(true);
    dank.querySelector('[data-danktext]').textContent = text;
    formular.hidden = true;
    platz.append(dank);
    platz.querySelector('.dank button').focus();
  }

  async function senden() {
    const a = angaben();
    const text = nachricht(a);
    melde('');

    // Ohne Empfänger auf dem Server geht die Anfrage über das eigene Mailprogramm.
    if (!ziel) {
      location.href = `${adresse}?subject=${encodeURIComponent(`Apéro-Anfrage (${a.fuer})`)}&body=${encodeURIComponent(text)}`;
      melde(texte.mailprogramm);
      return;
    }

    if (!a.name || !a.kontakt) {
      melde(texte.kontaktFehlt, true);
      formular.elements[a.name ? 'kontakt' : 'name'].focus();
      return;
    }
    // Spam-Schutz ohne Captcha: das versteckte Feld bleibt bei Menschen leer, und niemand sendet nach zwei Sekunden.
    // Der Empfänger prüft beides noch einmal selbst.
    if (feld('website') || Date.now() - geladen < 2000) return;

    const knopf = formular.querySelector('[type=submit]');
    knopf.disabled = true;
    melde(texte.unterwegs);
    try {
      const antwort = await fetch(ziel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...a, nachricht: text, website: feld('website'), dauer: Date.now() - geladen }),
      });
      if (!antwort.ok) throw new Error(`Antwort ${antwort.status}`);
      // Der Dank erscheint erst hier, wenn der Versand wirklich geklappt hat.
      danke(texte.gesendet);
    } catch {
      melde(texte.fehler, true);
    } finally {
      knopf.disabled = false;
    }
  }

  // Plus und Minus an den Mengen.
  formular.addEventListener('click', (ereignis) => {
    const knopf = ereignis.target.closest('[data-schritt]');
    if (!knopf) return;
    const eingabe = knopf.parentElement.querySelector('input');
    const wert = Math.min(Number(eingabe.max), Math.max(0, Number(eingabe.value) + Number(knopf.dataset.schritt)));
    eingabe.value = String(wert);
    auffrischen();
  });
  formular.addEventListener('input', auffrischen);
  formular.addEventListener('change', auffrischen);
  formular.addEventListener('submit', (ereignis) => {
    ereignis.preventDefault();
    senden();
  });

  // Das Formular zieht ins Bestellfenster um, im Kapitel bleibt der Ruf dazu.
  platz.append(formular);
  document.querySelector('[data-formularplatz]').remove();
  document.querySelector('[data-ruf]').hidden = false;
  formular.querySelector('[data-ankunft]').hidden = false;

  function oeffnen(verweis) {
    if (verweis.dataset.fuer) formular.querySelector(`[name=fuer][value="${verweis.dataset.fuer}"]`).checked = true;
    if (formular.hidden) {
      platz.querySelector('.dank')?.remove();
      formular.reset();
      formular.hidden = false;
      melde('');
    }
    auffrischen();
    fenster.showModal();
    const posten = verweis.dataset.kreation && formular.querySelector(`[data-posten="${verweis.dataset.kreation}"]`);
    if (posten) {
      posten.scrollIntoView({ block: 'center' });
      posten.querySelector('input').focus();
    } else {
      fenster.scrollTop = 0;
    }
  }

  // Jeder Verweis auf die Anfrage öffnet das Fenster.
  document.addEventListener('click', (ereignis) => {
    const verweis = ereignis.target.closest('a[href$="#anfrage"]');
    if (verweis) {
      ereignis.preventDefault();
      oeffnen(verweis);
    }
    if (ereignis.target.closest('[data-zu]') || ereignis.target === fenster) fenster.close();
  });
  auffrischen();
}

// Ein Verweis auf einen Abschnitt im Rechtlichen klappt ihn auf.
function aufklappen() {
  const ziel = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (ziel && ziel.tagName === 'DETAILS') {
    ziel.open = true;
    ziel.scrollIntoView();
  }
}

// Die beiden Teile sind unabhängig: Fällt einer aus, läuft der andere weiter,
// und die Seite zeigt für den ausgefallenen ihre Fassung ohne Skript.
function versuche(teil, klasse) {
  try {
    teil();
  } catch (fehler) {
    wurzel.classList.remove(klasse);
    console.error(fehler);
  }
}
if (wurzel.classList.contains('bewegt')) versuche(bewegung, 'bewegt');
versuche(anfrage, 'js');
wurzel.dataset.laeuft = '1';
addEventListener('hashchange', aufklappen);
aufklappen();
