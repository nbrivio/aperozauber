const betrag = (wert) => (Number.isInteger(wert) ? String(wert) : wert.toFixed(2));

/** Preiszeile einer Kachel: «ab CHF 100» für Kreationen, «CHF 6.50 pro Glas» für Beilagen. */
export function preiszeile(kreation) {
  if (kreation.art === 'beilage') return `CHF\u00a0${betrag(kreation.stueckpreis)} pro ${kreation.einheit}`;
  return `ab CHF\u00a0${betrag(Math.min(...kreation.groessen.map((g) => g.preis)))}`;
}

/** Preise je Grösse in einer Zeile: «S ab CHF 100, M ab CHF 120, L ab CHF 140». */
export const preisJeGroesse = (kreation) => kreation.groessen.map((g) => `${g.groesse} ab CHF\u00a0${betrag(g.preis)}`).join(', ');

/** Beschriftung des Mengenfelds einer Beilage in der Anfrage. */
export const mengenwort = (kreation) => (kreation.einheit === 'Brot' ? 'Stück' : kreation.einheit);
