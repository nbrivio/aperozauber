// Ein Titel darf einen Teil zwischen Sternen tragen, der kursiv gesetzt wird.
const zeichen = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const sicher = (text) => text.replace(/[&<>"]/g, (z) => zeichen[z]);

export const titelAlsHtml = (titel) => sicher(titel).replace(/\*([^*]+)\*/g, '<em>$1</em>');
export const titelAlsText = (titel) => titel.replace(/\*/g, '');
