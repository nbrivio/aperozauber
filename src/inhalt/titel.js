// Ein Titel darf einen Teil zwischen Sternen tragen. Er wird in Handschrift gesetzt.
// Umbrüche: Nach jedem Satz beginnt eine neue Zeile, damit kein Satz mitten im Gedanken
// umbricht. Ein senkrechter Strich «|» setzt einen Umbruch von Hand, wo es einen braucht.
const zeichen = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const sicher = (text) => text.replace(/[&<>"]/g, (z) => zeichen[z]);

// Teilt nach Satzende und am Strich. Ein Teil in Sternen bleibt immer ganz.
function zeilen(titel) {
  const teile = titel.split(/\s*\|\s*|(?<=[.?!])\s+/).filter(Boolean);
  const ganz = [];
  for (const teil of teile) {
    const offen = ganz.length > 0 && (ganz.at(-1).match(/\*/g) ?? []).length % 2 === 1;
    if (offen) ganz[ganz.length - 1] += ` ${teil}`;
    else ganz.push(teil);
  }
  return ganz;
}

export const titelAlsHtml = (titel, marke = 'span') => {
  const hand = (text) => sicher(text).replace(/\*([^*]+)\*/g, marke === 'em' ? '<em>$1</em>' : '<span class="hand">$1</span>');
  const teile = zeilen(titel);
  return teile.length === 1 ? hand(teile[0]) : teile.map((teil) => `<span class="satzzeile">${hand(teil)}</span>`).join(' ');
};
export const titelAlsText = (titel) => titel.replace(/\*/g, '').replace(/\s*\|\s*/g, ' ');
