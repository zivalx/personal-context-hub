import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(process.cwd(), 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#8B5CF6');
  gradient.addColorStop(1, '#A855F7');

  // Draw rounded rectangle
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Draw sparkle/star icon
  ctx.fillStyle = 'white';

  // Main star
  const centerX = size / 2;
  const centerY = size / 2;
  const starSize = size * 0.4;

  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI / 2) - Math.PI / 4;
    const x = centerX + Math.cos(angle) * starSize;
    const y = centerY + Math.sin(angle) * starSize;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    const innerAngle = angle + Math.PI / 4;
    const innerX = centerX + Math.cos(innerAngle) * (starSize * 0.4);
    const innerY = centerY + Math.sin(innerAngle) * (starSize * 0.4);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();

  // Save PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Generated icon${size}.png`);
});

console.log('All icons generated successfully!');
