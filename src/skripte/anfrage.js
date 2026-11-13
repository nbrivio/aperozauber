// Das Bestellfenster, auf jeder Seite. Ohne dieses Skript steht das Formular im Kapitel Anfrage
// und öffnet das Mailprogramm.

const wurzel = document.documentElement;

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
      // Auf einer Themenseite steht der Anlass schon fest.
      anlass: document.body.dataset.anlass ?? '',
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
    if (a.anlass) zeilen.push(`Anlass: ${a.anlass}`);
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
      location.href = `${adresse}?subject=${encodeURIComponent(`Apéro-Anfrage (${a.anlass || a.fuer})`)}&body=${encodeURIComponent(text)}`;
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

try {
  anfrage();
} catch (fehler) {
  wurzel.classList.remove('js');
  console.error(fehler);
}
// Meldung an den Schalter im Kopf: Das Skript ist angekommen.
wurzel.dataset.laeuft = '1';
