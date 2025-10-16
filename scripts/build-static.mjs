import { cp, mkdir, rm, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const entriesToCopy = [
  ['index.html', 'index.html'],
  ['404.html', '404.html'],
  ['assets', 'assets']
];

const exists = async (target) => {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const copyEntry = async ([sourceRel, destinationRel]) => {
  const sourcePath = path.join(projectRoot, sourceRel);
  if (!(await exists(sourcePath))) {
    return;
  }

  const destinationPath = path.join(publicDir, destinationRel);
  await cp(sourcePath, destinationPath, { recursive: true });
};

const main = async () => {
  await rm(publicDir, { recursive: true, force: true });
  await mkdir(publicDir, { recursive: true });
  await Promise.all(entriesToCopy.map(copyEntry));
};

main().catch((error) => {
  console.error('[build-static] Failed to prepare public directory', error);
  process.exitCode = 1;
});
