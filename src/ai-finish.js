import JSZip from 'jszip'
import { createPreservationMask } from './painting.js'

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Impossible de préparer l’image.')), 'image/png')
  })
}

function safeName(value) {
  return String(value || 'oeuvre')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildPrompt(renderInfo, strength) {
  const style = renderInfo.paintStyleLabel || renderInfo.paintStyle || 'peinture expressive'
  const theme = renderInfo.symbolTheme || 'abstrait'
  return [
    `Finition picturale légère d’une composition algorithmique d’échecs, matière ${style}, univers ${theme}.`,
    `Intensité de transformation cible : ${strength} %.`,
    'Conserver strictement la composition, les trajectoires principales, les zones focales, la palette et les proportions.',
    'Enrichir seulement la matière : pigments, épaisseur, irrégularité naturelle du pinceau, fusion locale des transitions et texture de support.',
    'Le masque preserve-mask.png indique les zones à protéger : le blanc signifie conservation forte, le noir autorise davantage de liberté de texture.',
    'Ne pas inventer de nouvelles pièces, nouveaux personnages, échiquier, lettres, chiffres, texte, bordure, interface ou éléments décoratifs.',
    'Ne pas rendre les traits lumineux, vectoriels, néon ou numériques. Éviter le flou global et les halos artificiels.',
  ].join(' ')
}

export async function downloadAiFinishPack({ canvas, analysis, sourcePgn, renderInfo, options, strength = 28 }) {
  const normalizedStrength = Math.max(10, Math.min(50, Number(strength) || 28))
  const mask = createPreservationMask(analysis, sourcePgn, options)
  const [sourceBlob, maskBlob] = await Promise.all([canvasToBlob(canvas), canvasToBlob(mask)])
  const prompt = buildPrompt(renderInfo, normalizedStrength)
  const manifest = {
    schema: 'chess-paint-ai-finish/v1',
    chessPaintVersion: '1.4.0',
    generatedAt: new Date().toISOString(),
    strength: normalizedStrength / 100,
    preserveComposition: true,
    sourceImage: 'source-algorithmique.png',
    preservationMask: 'preserve-mask.png',
    palette: renderInfo.palette,
    paintStyle: renderInfo.paintStyle,
    universe: renderInfo.symbolTheme,
    backgroundFamily: renderInfo.family,
    hotspots: renderInfo.heatmapData?.hotspots?.slice(0, 5).map(({ square, intensity }) => ({ square, intensity })) || [],
    importantPieces: renderInfo.placements?.map(({ piece, rank }) => ({ rank, id: piece.id, type: piece.type, color: piece.color, square: piece.finalSquare })) || [],
    prompt,
    negativePrompt: 'digital art, vector lines, neon glow, UI, dashboard, chessboard grid, coordinates, text, new characters, altered composition, displaced focal point',
  }

  const instructions = `CHESS PAINT — PACK DE FINITION IA\n\n${prompt}\n\n` +
    '1. Utilise source-algorithmique.png comme image de départ.\n' +
    '2. Utilise preserve-mask.png comme masque de conservation si ton outil accepte un masque.\n' +
    `3. Règle une force image-vers-image faible, proche de ${normalizedStrength} %.\n` +
    '4. Compare toujours le résultat avec la source : la partie doit rester reconnaissable.\n\n' +
    'Aucune image n’a été envoyée par Chess Paint. Ce dossier a été créé localement dans ton navigateur.'

  const zip = new JSZip()
  zip.file('source-algorithmique.png', sourceBlob)
  zip.file('preserve-mask.png', maskBlob)
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('INSTRUCTIONS.txt', instructions)
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const title = safeName(analysis.artworkTitle || `${analysis.headers.White || 'blancs'}-${analysis.headers.Black || 'noirs'}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `chess-paint-${title}-pack-ia.zip`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
