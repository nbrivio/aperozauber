// Rechnet aus dem Originalsiegel die festen Markenbilder: Arbeitsfassungen für die Seite,
// Favicon, Touch-Icon und Vorschaubild. Die Vektordateien bleiben die Vorlage.
// Nur nötig, wenn sich das Logo ändert: `npm run markenbilder`.
import sharp from 'sharp';

const quelle = 'src/assets/marke/siegel.svg';
const paper = '#f6f3ec';

const siegel = (kante) => sharp(quelle).resize(kante, kante).png().toBuffer();

await sharp({ create: { width: 96, height: 96, channels: 4, background: paper } })
  .composite([{ input: await siegel(96) }])
  .png()
  .toFile('public/favicon.png');

await sharp({ create: { width: 180, height: 180, channels: 4, background: paper } })
  .composite([{ input: await siegel(164) }])
  .png()
  .toFile('public/apple-touch-icon.png');

await sharp({ create: { width: 1200, height: 630, channels: 4, background: paper } })
  .composite([{ input: await siegel(540) }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/vorschau.jpg');

// Arbeitsfassungen: gross genug für jede Verwendung, den Rest rechnet der Bau.
for (const name of ['siegel', 'siegel-weiss']) {
  await sharp(`src/assets/marke/${name}.svg`)
    .resize(960, 960)
    .webp({ lossless: true })
    .toFile(`src/assets/marke/${name}.webp`);
}

console.log('Markenbilder geschrieben.');
