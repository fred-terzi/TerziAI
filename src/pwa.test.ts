import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PWA Configuration', () => {
  test('manifest.json should exist in public directory', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  test('manifest.json should be valid JSON with required fields', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Check required manifest fields
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest).toHaveProperty('icons');
  });

  test('manifest should have proper PWA configuration', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe('TerziAI - Local AI Chat');
    expect(manifest.short_name).toBe('TerziAI');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/TerziAI/');
  });

  test('manifest should include all required icon sizes', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const expectedSizes = [
      '72x72',
      '96x96',
      '128x128',
      '144x144',
      '152x152',
      '192x192',
      '384x384',
      '512x512',
    ];
    const iconSizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);

    expectedSizes.forEach((size) => {
      expect(iconSizes).toContain(size);
    });
  });

  test('all icon paths should use correct base path for GitHub Pages', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    manifest.icons.forEach((icon: { src: string }) => {
      expect(icon.src).toMatch(/^\/TerziAI\/icons\//);
    });
  });

  test('manifest should have theme and background colors', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest).toHaveProperty('theme_color');
    expect(manifest).toHaveProperty('background_color');
    expect(manifest.theme_color).toBe('#646cff');
    expect(manifest.background_color).toBe('#242424');
  });

  test('all PNG icon files should exist', () => {
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    const expectedIcons = [
      'icon-72x72.png',
      'icon-96x96.png',
      'icon-128x128.png',
      'icon-144x144.png',
      'icon-152x152.png',
      'icon-192x192.png',
      'icon-384x384.png',
      'icon-512x512.png',
    ];

    expectedIcons.forEach((iconFile) => {
      const iconPath = path.join(iconsDir, iconFile);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  test('vite.config.ts should have base path configured for GitHub Pages', () => {
    const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // Check that base path is configured for GitHub Pages
    expect(viteConfigContent).toContain("base: '/TerziAI/'");
  });

  test('index.html should reference manifest with correct base path', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    expect(indexContent).toContain('href="/TerziAI/manifest.json"');
    expect(indexContent).toContain('href="/TerziAI/icons/icon-192x192.svg"');
  });

  test('GitHub Actions workflow should exist for deployment', () => {
    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  test('GitHub Actions workflow should deploy to GitHub Pages', () => {
    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

    expect(workflowContent).toContain('actions/configure-pages');
    expect(workflowContent).toContain('actions/upload-pages-artifact');
    expect(workflowContent).toContain('actions/deploy-pages');
    expect(workflowContent).toContain('npm run all');
  });
});
