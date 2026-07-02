import sharp from 'sharp';
import { writeFileSync } from 'fs';

// SVG do ícone STM Radar — fundo azul marinho, radar dourado
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fundo azul marinho -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0A1628"/>

  <!-- Ondas do radar (círculos concêntricos) -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.42}" fill="none" stroke="#F5B731" stroke-width="${size*0.018}" opacity="0.25"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.30}" fill="none" stroke="#F5B731" stroke-width="${size*0.022}" opacity="0.40"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.18}" fill="none" stroke="#F5B731" stroke-width="${size*0.028}" opacity="0.60"/>

  <!-- Círculo central preenchido -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.09}" fill="#F5B731"/>

  <!-- Linha do radar (sweep) -->
  <line
    x1="${size/2}" y1="${size/2}"
    x2="${size/2}" y2="${size*0.12}"
    stroke="#F5B731" stroke-width="${size*0.03}" stroke-linecap="round" opacity="0.7"
  />
  <line
    x1="${size/2}" y1="${size/2}"
    x2="${size*0.78}" y2="${size*0.3}"
    stroke="#F5B731" stroke-width="${size*0.022}" stroke-linecap="round" opacity="0.35"
  />

  <!-- Ponto de alerta (blip) -->
  <circle cx="${size*0.68}" cy="${size*0.32}" r="${size*0.04}" fill="#F5B731"/>
</svg>`;

const sizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const svgBuffer = Buffer.from(svg(size));
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  writeFileSync(`public/icons/icon-${size}.png`, pngBuffer);
  console.log(`✅ icon-${size}.png gerado`);
}

console.log('\n🎉 Todos os ícones gerados!');
