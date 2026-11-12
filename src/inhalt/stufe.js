// «test» ist die Voreinstellung: keine Aufnahme in Suchmaschinen, Entwürfe erlaubt.
// «live» verlangt freigegebene Texte und bestätigte Angebote.
const wert = process.env.SITE_STUFE ?? 'test';
if (wert !== 'test' && wert !== 'live') {
  throw new Error(`SITE_STUFE muss «test» oder «live» sein, erhalten: ${wert}`);
}
export const stufe = wert;
export const istLive = wert === 'live';

/** Bricht den Bau auf der richtigen Adresse ab, wenn noch Entwürfe vorhanden sind. */
export function verlangeFreigabe(eintraege, feld, bezeichnung) {
  if (!istLive) return;
  const offen = eintraege.filter((e) => !e.data[feld]).map((e) => e.id);
  if (offen.length > 0) {
    throw new Error(`${bezeichnung} ohne Freigabe: ${offen.join(', ')}`);
  }
}
