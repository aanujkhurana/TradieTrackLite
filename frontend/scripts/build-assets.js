#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function renderPng(svgPath, pngPath, width, height) {
  if (!fs.existsSync(svgPath)) {
    console.error(`[skip] missing source svg: ${svgPath}`);
    return;
  }
  const svg = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svg, {
    background: 'transparent',
    fitTo: {
      mode: 'width',
      value: width,
    },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Arial',
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  fs.writeFileSync(pngPath, png);
  console.log(`[ok] ${path.relative(ROOT, pngPath)} (${width}x${rendered.height})`);
}

function main() {
  // App icon (1024x1024). iOS applies its own corner mask.
  renderPng(
    path.join(ASSETS, 'icon-source.svg'),
    path.join(ASSETS, 'icon.png'),
    1024,
    1024
  );

  // Android adaptive icon (1024x1024 foreground; background colour is in app.config.js).
  renderPng(
    path.join(ASSETS, 'adaptive-icon-source.svg'),
    path.join(ASSETS, 'adaptive-icon.png'),
    1024,
    1024
  );

  // Splash (1242x2436, iPhone X proportions). Single image used for both modes.
  renderPng(
    path.join(ASSETS, 'splash-source.svg'),
    path.join(ASSETS, 'splash.png'),
    1242,
    2436
  );

  // Also generate a 512x512 favicon-style icon for store listings (optional).
  renderPng(
    path.join(ASSETS, 'icon-source.svg'),
    path.join(ASSETS, 'icon-512.png'),
    512,
    512
  );
}

main();
