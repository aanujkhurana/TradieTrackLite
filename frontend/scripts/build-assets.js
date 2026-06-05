#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function renderPng(svg, pngPath, width, height) {
  const resvg = new Resvg(svg, {
    background: 'transparent',
    fitTo:
      height && height !== width
        ? { mode: 'width', value: width }
        : { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Arial',
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  fs.writeFileSync(pngPath, png);
  console.log(
    `[ok] ${path.relative(ROOT, pngPath)} (${width}x${rendered.height})`
  );
}

function loadSvg(name) {
  const svgPath = path.join(ASSETS, name);
  if (!fs.existsSync(svgPath)) {
    throw new Error(`Missing source svg: ${svgPath}`);
  }
  return fs.readFileSync(svgPath, 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildMarketingAssets() {
  const iconSvg = loadSvg('icon-source.svg');
  const splashSvg = loadSvg('splash-source.svg');

  // Master icons (used by Expo and stores as 1024 source).
  renderPng(iconSvg, path.join(ASSETS, 'icon.png'), 1024, 1024);
  renderPng(iconSvg, path.join(ASSETS, 'icon-512.png'), 512, 512);

  // Adaptive icon (Android, transparent foreground).
  renderPng(
    loadSvg('adaptive-icon-source.svg'),
    path.join(ASSETS, 'adaptive-icon.png'),
    1024,
    1024
  );

  // Splash (1242x2436, iPhone X proportions). Single image for both modes.
  renderPng(splashSvg, path.join(ASSETS, 'splash.png'), 1242, 2436);

  // iOS app icon set. Stores can derive smaller sizes from 1024; the
  // full set is generated so source control mirrors what ships.
  const iosDir = path.join(ASSETS, 'ios');
  ensureDir(iosDir);
  const iosSizes = [
    { name: 'icon-20@2x.png', size: 40 },
    { name: 'icon-20@3x.png', size: 60 },
    { name: 'icon-29@2x.png', size: 58 },
    { name: 'icon-29@3x.png', size: 87 },
    { name: 'icon-40@2x.png', size: 80 },
    { name: 'icon-40@3x.png', size: 120 },
    { name: 'icon-60@2x.png', size: 120 },
    { name: 'icon-60@3x.png', size: 180 },
    { name: 'icon-76.png', size: 76 },
    { name: 'icon-76@2x.png', size: 152 },
    { name: 'icon-83.5@2x.png', size: 167 },
    { name: 'icon-1024.png', size: 1024 },
  ];
  for (const { name, size } of iosSizes) {
    renderPng(iconSvg, path.join(iosDir, name), size, size);
  }

  // Android app icon set. Adaptive icon handles most cases; legacy
  // mipmap sizes are still required by some launchers and the Play
  // Console preview.
  const androidDir = path.join(ASSETS, 'android');
  ensureDir(androidDir);
  const androidSizes = [
    { name: 'mipmap-mdpi.png', size: 48 },
    { name: 'mipmap-hdpi.png', size: 72 },
    { name: 'mipmap-xhdpi.png', size: 96 },
    { name: 'mipmap-xxhdpi.png', size: 144 },
    { name: 'mipmap-xxxhdpi.png', size: 192 },
  ];
  for (const { name, size } of androidSizes) {
    renderPng(iconSvg, path.join(androidDir, name), size, size);
  }

  // The Play Store feature graphic is a wide 1024x500 layout that
  // does not derive from the splash or icon SVGs. The store team
  // creates this in Figma / a designer tool. The placeholder
  // directory is left here so the build does not fail; place a real
  // `feature-graphic.png` (1024x500) in `assets/store/` before
  // submitting to the Play Console.
  const featureDir = path.join(ASSETS, 'store');
  ensureDir(featureDir);
}

buildMarketingAssets();
