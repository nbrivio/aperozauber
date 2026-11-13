// Ein Titel darf einen Teil zwischen Sternen tragen. Er wird in Handschrift gesetzt.
const zeichen = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const sicher = (text) => text.replace(/[&<>"]/g, (z) => zeichen[z]);

export const titelAlsHtml = (titel, marke = 'span') =>
  sicher(titel).replace(/\*([^*]+)\*/g, marke === 'em' ? '<em>$1</em>' : '<span class="hand">$1</span>');
export const titelAlsText = (titel) => titel.replace(/\*/g, '');
