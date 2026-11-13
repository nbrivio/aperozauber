// Läuft im Kopf, bevor die Seite gezeichnet wird: Bewegung nur, wenn sie erwünscht ist.
// Meldet sich das Hauptskript nach dem Laden nicht, fällt die Seite auf die ruhige Fassung zurück.
const wurzel = document.documentElement;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  wurzel.classList.add('bewegt');
  addEventListener('load', () => {
    setTimeout(() => {
      if (!wurzel.dataset.laeuft) wurzel.classList.remove('bewegt');
    }, 800);
  });
}
