import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const netlifyConfig = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const nextConfig = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8');
const buildSection = netlifyConfig.match(/^\[build\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/m)?.[1];

test('Netlify builds standard Next.js artifacts rather than Vinext output', () => {
  assert.ok(packageJson.dependencies.next);
  assert.equal(packageJson.scripts.build, 'next build --webpack');
  assert.equal(packageJson.scripts.start, 'next start');
  assert.ok(buildSection, 'Netlify must define a build section');
  assert.match(buildSection, /^\s*command\s*=\s*"pnpm exec next build --webpack"\s*$/m);
  assert.match(buildSection, /^\s*publish\s*=\s*"\.next"\s*$/m);
  assert.doesNotMatch(nextConfig, /\bdistDir\s*:/);
  assert.doesNotMatch(nextConfig, /\boutput\s*:\s*['"]export['"]/);
});
