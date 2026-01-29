import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '../public');

// Fonction pour créer un logo SVG avec les initiales "DS"
function createLogoSVG(size) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Fond avec dégradé -->
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
      
      <!-- Lettres DS -->
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >DS</text>
      
      <!-- Petit point décoratif -->
      <circle cx="${size * 0.8}" cy="${size * 0.2}" r="${size * 0.08}" fill="#60a5fa" opacity="0.8"/>
    </svg>
  `);
}

async function generateIcons() {
  try {
    // Créer le dossier public s'il n'existe pas
    await fs.mkdir(publicDir, { recursive: true });

    console.log('🎨 Génération des icônes PWA...\n');

    const sizes = [
      { size: 64, name: 'pwa-64x64.png' },
      { size: 192, name: 'pwa-192x192.png' },
      { size: 512, name: 'pwa-512x512.png' },
    ];

    // Générer les icônes standards
    for (const { size, name } of sizes) {
      const svg = createLogoSVG(size);
      await sharp(svg)
        .png()
        .toFile(join(publicDir, name));
      
      console.log(`✅ Généré: ${name}`);
    }

    // Icône maskable (avec padding pour le safe zone)
    const maskableSvg = createLogoSVG(416); // 512 * 0.8125
    await sharp(maskableSvg)
      .extend({
        top: 48,
        bottom: 48,
        left: 48,
        right: 48,
        background: { r: 30, g: 41, b: 59, alpha: 1 } // couleur theme_color #1e293b
      })
      .png()
      .toFile(join(publicDir, 'maskable-icon-512x512.png'));

    console.log('✅ Généré: maskable-icon-512x512.png');

    // Apple touch icon (180x180)
    const appleSvg = createLogoSVG(180);
    await sharp(appleSvg)
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));

    console.log('✅ Généré: apple-touch-icon.png');

    // Favicon (32x32)
    const faviconSvg = createLogoSVG(32);
    await sharp(faviconSvg)
      .png()
      .toFile(join(publicDir, 'favicon.png'));

    console.log('✅ Généré: favicon.png');

    // Favicon.ico (optionnel)
    await sharp(faviconSvg)
      .resize(32, 32)
      .toFormat('png')
      .toFile(join(publicDir, 'favicon.ico'));

    console.log('✅ Généré: favicon.ico');

    // Screenshots pour le manifeste (optionnel mais recommandé)
    
    // Screenshot mobile (750x1334)
    const mobileScreenshot = Buffer.from(`
      <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
        <rect width="750" height="1334" fill="#f9fafb"/>
        <rect x="0" y="0" width="750" height="200" fill="#1e293b"/>
        <text x="375" y="100" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle">DYNAMIX SERVICES</text>
        <text x="375" y="150" font-family="Arial" font-size="24" fill="#94a3b8" text-anchor="middle">Gestion des Congés</text>
        <rect x="50" y="250" width="650" height="200" rx="20" fill="white" stroke="#e5e7eb" stroke-width="2"/>
        <text x="375" y="330" font-family="Arial" font-size="32" font-weight="bold" fill="#1f2937" text-anchor="middle">Tableau de bord</text>
        <text x="375" y="380" font-family="Arial" font-size="20" fill="#6b7280" text-anchor="middle">Gérez vos congés facilement</text>
      </svg>
    `);

    await sharp(mobileScreenshot)
      .png()
      .toFile(join(publicDir, 'screenshot-mobile.png'));

    console.log('✅ Généré: screenshot-mobile.png');

    // Screenshot wide (1280x720)
    const wideScreenshot = Buffer.from(`
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="720" fill="#f9fafb"/>
        <rect x="0" y="0" width="300" height="720" fill="#1e293b"/>
        <text x="150" y="80" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">DYNAMIX</text>
        <text x="150" y="110" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle">SERVICES</text>
        <rect x="350" y="50" width="880" height="150" rx="15" fill="white" stroke="#e5e7eb" stroke-width="2"/>
        <text x="790" y="110" font-family="Arial" font-size="36" font-weight="bold" fill="#1f2937" text-anchor="middle">Tableau de bord</text>
        <text x="790" y="150" font-family="Arial" font-size="22" fill="#6b7280" text-anchor="middle">Vue d'ensemble de vos congés</text>
      </svg>
    `);

    await sharp(wideScreenshot)
      .png()
      .toFile(join(publicDir, 'screenshot-wide.png'));

    console.log('✅ Généré: screenshot-wide.png');

    console.log('\n🎉 Toutes les icônes PWA ont été générées avec succès!');
    console.log('📁 Emplacement: frontend/public/\n');
    
    console.log('📋 Fichiers générés:');
    console.log('   - pwa-64x64.png');
    console.log('   - pwa-192x192.png');
    console.log('   - pwa-512x512.png');
    console.log('   - maskable-icon-512x512.png');
    console.log('   - apple-touch-icon.png');
    console.log('   - favicon.png');
    console.log('   - favicon.ico');
    console.log('   - screenshot-mobile.png');
    console.log('   - screenshot-wide.png\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

generateIcons();