#!/usr/bin/env node
/**
 * Generate app/(features)/anchor-localnet/program-ids.generated.ts from the
 * canonical source of truth: gridtokenx-anchor/Anchor.toml [programs.localnet].
 *
 * Run automatically on `predev` / `prebuild`. Keeps program IDs in the explorer
 * from drifting away from the deployed programs — no hardcoded literals live in
 * config.ts anymore.
 *
 * Standalone container builds may not have the sibling anchor repo checked out.
 * In that case we keep the committed generated file (warn, don't fail) so the
 * build still succeeds with the last-known IDs. Set ANCHOR_TOML_PATH to override
 * the lookup location.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const explorerRoot = resolve(__dirname, '..');
const outFile = resolve(explorerRoot, 'app/(features)/anchor-localnet/program-ids.generated.ts');

const tomlPath =
  process.env.ANCHOR_TOML_PATH ??
  resolve(explorerRoot, '../gridtokenx-anchor/Anchor.toml');

/** Parse the `[programs.localnet]` section into { name: id }. */
function parseLocalnetPrograms(toml) {
  const out = {};
  let inSection = false;
  for (const raw of toml.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('[')) {
      inSection = line === '[programs.localnet]';
      continue;
    }
    if (!inSection || !line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function render(programs) {
  const entries = Object.entries(programs)
    .map(([name, id]) => `  ${name}: '${id}',`)
    .join('\n');
  return `/**
 * AUTO-GENERATED — DO NOT EDIT.
 * Source of truth: gridtokenx-anchor/Anchor.toml [programs.localnet].
 * Regenerate: \`node scripts/gen-program-ids.mjs\` (runs on predev/prebuild).
 */
export const PROGRAM_IDS = {
${entries}
} as const;

export type GeneratedProgramName = keyof typeof PROGRAM_IDS;
`;
}

function main() {
  if (!existsSync(tomlPath)) {
    if (existsSync(outFile)) {
      console.warn(
        `[gen-program-ids] Anchor.toml not found at ${tomlPath} — keeping committed ${outFile}`,
      );
      return;
    }
    console.error(
      `[gen-program-ids] Anchor.toml not found at ${tomlPath} and no committed generated file exists. ` +
        `Set ANCHOR_TOML_PATH or check out gridtokenx-anchor.`,
    );
    process.exit(1);
  }

  const programs = parseLocalnetPrograms(readFileSync(tomlPath, 'utf8'));
  if (Object.keys(programs).length === 0) {
    console.error(`[gen-program-ids] No programs parsed from [programs.localnet] in ${tomlPath}`);
    process.exit(1);
  }

  const next = render(programs);
  const prev = existsSync(outFile) ? readFileSync(outFile, 'utf8') : null;
  if (prev === next) {
    console.log(`[gen-program-ids] ${Object.keys(programs).length} program IDs up to date`);
    return;
  }
  writeFileSync(outFile, next);
  console.log(
    `[gen-program-ids] wrote ${Object.keys(programs).length} program IDs from ${tomlPath}`,
  );
}

main();
