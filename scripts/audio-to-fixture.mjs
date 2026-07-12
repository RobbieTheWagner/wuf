// Converts an audio file into a base64 data-URI TypeScript module for use as a
// test fixture (matching tests/fixtures/sample-audio-data.ts).
//
// Usage:
//   node scripts/audio-to-fixture.mjs <input-audio> [output.ts]
//
// If no output path is given, the module is printed to stdout.

import { readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const MIME_BY_EXT = {
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

async function main() {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath) {
    throw new Error(
      'Usage: node scripts/audio-to-fixture.mjs <input-audio> [output.ts]',
    );
  }

  const ext = extname(inputPath).toLowerCase();
  const mime = MIME_BY_EXT[ext];

  if (!mime) {
    throw new Error(
      `Unknown audio extension "${ext}". Supported: ${Object.keys(MIME_BY_EXT).join(', ')}`,
    );
  }

  const bytes = await readFile(inputPath);
  const dataUri = `data:${mime};base64,${bytes.toString('base64')}`;

  const module = `// Generated from ${basename(inputPath)} by scripts/audio-to-fixture.mjs
const audioDataUri = '${dataUri}';

export default audioDataUri;
`;

  if (outputPath) {
    await writeFile(outputPath, module);
    console.error(
      `Wrote ${outputPath} (${(bytes.length / 1024).toFixed(1)} KiB of audio)`,
    );
  } else {
    process.stdout.write(module);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
