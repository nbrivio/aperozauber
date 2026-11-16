// Adressen der bisherigen Seite (Squarespace), die nach der Umstellung weiter funktionieren müssen.
// Gleiche Pfade bleiben bestehen (/angebot, /uebermich, /info, /impressum). Hier stehen nur die,
// die es neu nicht mehr gibt. Alle Ziele enden mit Schrägstrich, weil die Seite so ausgeliefert wird.
export const weiterleitungen = {
  '/home': '/',
  '/cart': '/angebot/',
  '/checkout': '/angebot/',
};

// Alle Adressen, die die bisherige Seite in ihrer Sitemap hatte, plus Warenkorb.
// Die Prüfung stellt sicher, dass jede davon auf eine bestehende Seite führt.
export const bisherigeAdressen = ['/', '/home', '/angebot', '/uebermich', '/info', '/impressum', '/cart'];
