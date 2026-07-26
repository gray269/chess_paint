import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'node_modules', 'stockfish', 'bin')
const destination = resolve(root, 'public', 'stockfish')
const licenseSource = resolve(root, 'node_modules', 'stockfish', 'Copying.txt')

const files = [
  'stockfish-18-lite-single.js',
  'stockfish-18-lite-single.wasm',
]

if (!existsSync(source)) {
  throw new Error(
    'Stockfish est introuvable. Lance d’abord « npm install », puis réessaie.',
  )
}

await mkdir(destination, { recursive: true })

for (const file of files) {
  await copyFile(resolve(source, file), resolve(destination, file))
}

if (existsSync(licenseSource)) {
  await copyFile(licenseSource, resolve(destination, 'COPYING-STOCKFISH.txt'))
}

console.log('Moteur Stockfish copié dans public/stockfish.')
