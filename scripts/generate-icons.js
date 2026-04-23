// Script para gerar ícones PNG do STM Radar
// Instale: npm install canvas
// Execute: node scripts/generate-icons.js
//
// Ou use qualquer ferramenta de design para criar os ícones e salvar em public/icons/
// Tamanhos necessários: 32, 72, 96, 128, 144, 152, 192, 384, 512

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const SIZES = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const BG_COLOR = "#0A1628";
const GOLD_COLOR = "#F5B731";
const OUTPUT_DIR = path.join(__dirname, "../public/icons");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const size of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const padding = size * 0.15;
  const center = size / 2;
  const r = (size / 2) - padding;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Radar circles
  ctx.strokeStyle = GOLD_COLOR;
  ctx.lineWidth = size * 0.025;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(center, center, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(center, center, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(center, center, r * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Letra S central
  ctx.fillStyle = GOLD_COLOR;
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", center, center);

  const buffer = canvas.toBuffer("image/png");
  const filePath = path.join(OUTPUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Gerado: icon-${size}.png`);
}

console.log("\n🎉 Todos os ícones gerados em public/icons/");
