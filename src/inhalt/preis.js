const betrag = (wert) => (Number.isInteger(wert) ? String(wert) : wert.toFixed(2));

/** Preiszeile einer Kachel: «ab CHF 100» für Kreationen, «CHF 6.50 pro Glas» für Beilagen. */
export function preiszeile(kreation) {
  if (kreation.art === 'beilage') return `CHF\u00a0${betrag(kreation.stueckpreis)} pro ${kreation.einheit}`;
  return `ab CHF\u00a0${betrag(Math.min(...kreation.groessen.map((g) => g.preis)))}`;
}

/** Beschriftung des Mengenfelds einer Beilage in der Anfrage. */
export const mengenwort = (kreation) => (kreation.einheit === 'Brot' ? 'Stück' : kreation.einheit);
