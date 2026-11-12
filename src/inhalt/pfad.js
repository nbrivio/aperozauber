const wurzel = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Interner Pfad mit dem Unterpfad der jeweiligen Adresse. */
export function pfad(ziel = '/') {
  return `${wurzel}${ziel.startsWith('/') ? ziel : `/${ziel}`}`;
}
