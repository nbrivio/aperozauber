// Läuft im Kopf, bevor die Seite gezeichnet wird. «js» schaltet das Bestellfenster ein,
// «bewegt» die Bewegung beim Scrollen, sofern sie erwünscht ist. Meldet sich das Hauptskript
// nach dem Laden nicht, fällt die Seite auf die ruhige Fassung ohne Skript zurück.
const wurzel = document.documentElement;
wurzel.classList.add('js');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) wurzel.classList.add('bewegt');
addEventListener('load', () => {
  setTimeout(() => {
    if (!wurzel.dataset.laeuft) wurzel.classList.remove('js', 'bewegt');
  }, 800);
});
