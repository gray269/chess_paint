import './style.css'
import { analyzeGame, normalizePgn, parsePgn } from './chess-analysis.js'
import { downloadPainting, renderPainting } from './painting.js'
import { StockfishEngine } from './stockfish-engine.js'

window.__CHESS_PAINT_READY__ = true
window.__CHESS_PAINT_BOOTSTRAP__?.detach()

const samplePgn = `[Event "Partie exemple"]
[Site "Chess Paint"]
[Date "2026.07.08"]
[Round "-"]
[White "Blancs"]
[Black "Noirs"]
[Result "0-1"]

1. e3 Nc6 2. d4 d5 3. c3 Nf6 4. Qa4 Bd7 5. Nf3 e6 6. Ne5 Nxe5
7. Nd2 Bxa4 8. b3 Bd7 9. dxe5 Ne4 10. f3 Nxd2 11. Bxd2 Be7
12. e4 Bg5 13. f4 Bh6 14. exd5 exd5 15. Be3 O-O 16. O-O-O Qe7
17. Rxd5 Rad8 18. h4 Qa3+ 19. Kb1 Bf5+ 20. Ka1 Rxd5 21. Be2 c5
22. g4 Rfd8 23. gxf5 c4 24. Bxc4 Rd1+ 25. Rxd1 Rxd1+ 26. Bc1 Rxc1# 0-1`

const elements = {
  pgnInput: document.querySelector('#pgnInput'),
  pgnFile: document.querySelector('#pgnFile'),
  pasteButton: document.querySelector('#pasteButton'),
  exampleButton: document.querySelector('#exampleButton'),
  clearButton: document.querySelector('#clearButton'),
  depthSelect: document.querySelector('#depthSelect'),
  analyzeButton: document.querySelector('#analyzeButton'),
  stopButton: document.querySelector('#stopButton'),
  downloadButton: document.querySelector('#downloadButton'),
  installButton: document.querySelector('#installButton'),
  progressArea: document.querySelector('#progressArea'),
  progressBar: document.querySelector('#progressBar'),
  progressMessage: document.querySelector('#progressMessage'),
  progressPercent: document.querySelector('#progressPercent'),
  pgnValidation: document.querySelector('#pgnValidation'),
  pgnValidationTitle: document.querySelector('#pgnValidationTitle'),
  pgnValidationDetail: document.querySelector('#pgnValidationDetail'),
  statusMessage: document.querySelector('#statusMessage'),
  canvas: document.querySelector('#paintingCanvas'),
  canvasPlaceholder: document.querySelector('#canvasPlaceholder'),
  resultsSection: document.querySelector('#resultsSection'),
  summaryCards: document.querySelector('#summaryCards'),
  themeTitle: document.querySelector('#themeTitle'),
  themeCommentary: document.querySelector('#themeCommentary'),
  movesTable: document.querySelector('#movesTable'),
}

let engine = null
let abortController = null
let currentAnalysis = null
let currentPgnInfo = null
let validationTimer = null
let deferredInstallPrompt = null

elements.pgnInput.value = ''

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

function setBusy(isBusy) {
  elements.analyzeButton.disabled = isBusy || !currentPgnInfo
  elements.stopButton.disabled = !isBusy
  elements.depthSelect.disabled = isBusy
  elements.pgnFile.disabled = isBusy
  elements.pgnInput.disabled = isBusy
  elements.pasteButton.disabled = isBusy
  elements.exampleButton.disabled = isBusy
  elements.clearButton.disabled = isBusy
  elements.progressArea.hidden = !isBusy
}


function setPgnValidation(state, title, detail) {
  elements.pgnValidation.className = `pgn-validation is-${state}`
  elements.pgnValidationTitle.textContent = title
  elements.pgnValidationDetail.textContent = detail
}

function validatePgnInput({ announce = false } = {}) {
  const value = elements.pgnInput.value.trim()
  currentPgnInfo = null

  if (!value) {
    setPgnValidation('empty', 'Aucune partie détectée', 'Colle le PGN dans la zone ci-dessus.')
    elements.analyzeButton.textContent = 'Analyser et peindre'
    elements.analyzeButton.disabled = true
    return null
  }

  try {
    const parsed = parsePgn(value)
    currentPgnInfo = parsed
    const completeMoves = Math.floor(parsed.halfMoveCount / 2)
    const finalHalfMove = parsed.halfMoveCount % 2 ? ' + le dernier coup des Blancs' : ''
    setPgnValidation(
      'valid',
      'PGN reconnu — prêt à analyser',
      `${parsed.halfMoveCount} demi-coups détectés (${completeMoves} coups complets${finalHalfMove}). Résultat : ${parsed.result}.`,
    )
    elements.analyzeButton.textContent = `Analyser cette partie (${parsed.displayedMoveCount} coups)`
    elements.analyzeButton.disabled = false
    if (announce) elements.statusMessage.textContent = 'La partie est bien chargée. Appuie maintenant sur « Analyser cette partie ». '
    return parsed
  } catch (error) {
    setPgnValidation('invalid', 'PGN non reconnu', error?.message || 'Le texte contient une erreur de notation.')
    elements.analyzeButton.textContent = 'Analyser et peindre'
    elements.analyzeButton.disabled = true
    if (announce) elements.statusMessage.textContent = 'Le texte a été collé, mais il faut corriger le PGN avant l’analyse.'
    return null
  }
}

function schedulePgnValidation({ announce = false } = {}) {
  window.clearTimeout(validationTimer)
  validationTimer = window.setTimeout(() => validatePgnInput({ announce }), 120)
}

function updateProgress({ current, total, message }) {
  const percent = Math.round((current / Math.max(total, 1)) * 100)
  elements.progressBar.value = percent
  elements.progressMessage.textContent = message
  elements.progressPercent.textContent = `${percent} %`
}

function formatEvaluation(value) {
  if (Math.abs(value) > 90_000) return value > 0 ? 'Mat pour les Blancs' : 'Mat pour les Noirs'
  const pawns = value / 100
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)}`
}

function playerName(analysis, color) {
  return color === 'w'
    ? analysis.headers.White || 'Blancs'
    : analysis.headers.Black || 'Noirs'
}

function createSummaryCard(label, value, detail) {
  return `
    <article class="summary-card">
      <p>${label}</p>
      <strong>${value}</strong>
      <span>${detail}</span>
    </article>
  `
}

function renderResults(analysis) {
  const white = analysis.players.white
  const black = analysis.players.black
  const lastEvaluation = analysis.evaluations.at(-1)?.scoreWhite ?? 0

  elements.summaryCards.innerHTML = [
    createSummaryCard(
      'Titre généré',
      analysis.artworkTitle || 'Sans titre',
      analysis.scene?.label ? `Univers : ${analysis.scene.label}` : 'Univers non défini',
    ),
    createSummaryCard(
      playerName(analysis, 'w'),
      white ? `≈ ${white.range}` : '—',
      white ? `${white.averageLoss} cp de perte moyenne · ${white.bestRate} % de coups précis` : 'Estimation indisponible',
    ),
    createSummaryCard(
      playerName(analysis, 'b'),
      black ? `≈ ${black.range}` : '—',
      black ? `${black.averageLoss} cp de perte moyenne · ${black.bestRate} % de coups précis` : 'Estimation indisponible',
    ),
    createSummaryCard(
      'Ouverture reconnue',
      analysis.opening?.label || 'Ouverture libre',
      analysis.opening?.family ? `Famille : ${analysis.opening.family}` : 'Aucune famille reconnue',
    ),
    createSummaryCard(
      'Thème',
      analysis.theme.label,
      analysis.scene?.family ? `Registre : ${analysis.scene.family}` : 'Registre libre',
    ),
    createSummaryCard(
      'Évaluation finale',
      formatEvaluation(lastEvaluation),
      `${analysis.rows.length} demi-coups analysés · résultat ${analysis.result}`,
    ),
  ].join('')

  elements.themeTitle.textContent = analysis.artworkTitle || analysis.theme.label
  elements.themeCommentary.textContent = analysis.commentary

  elements.movesTable.innerHTML = analysis.rows.map((row) => {
    const moveLabel = `${row.moveNumber}${row.color === 'w' ? '.' : '…'} ${row.san}`
    const motifText = row.motifs.length ? row.motifs.join(', ') : '—'
    return `
      <tr>
        <td>${moveLabel}</td>
        <td><span class="quality quality-${row.quality}">${row.qualityLabel}</span></td>
        <td>${row.cpLoss} cp</td>
        <td><code>${row.bestMove || '—'}</code></td>
        <td>${motifText}</td>
      </tr>
    `
  }).join('')

  elements.resultsSection.hidden = false
}

async function pastePgnFromClipboard() {
  elements.statusMessage.textContent = ''

  if (!navigator.clipboard?.readText) {
    elements.pgnInput.focus()
    elements.statusMessage.textContent = 'Le collage automatique n’est pas autorisé par ce navigateur. Fais un appui long dans la zone, puis choisis « Coller ».'
    return
  }

  try {
    const clipboardText = (await navigator.clipboard.readText()).trim()
    if (!clipboardText) {
      elements.statusMessage.textContent = 'Le presse-papiers est vide.'
      return
    }
    elements.pgnInput.value = normalizePgn(clipboardText)
    elements.pgnInput.focus()
    elements.pgnInput.scrollLeft = 0
    validatePgnInput({ announce: true })
  } catch (error) {
    console.warn('Clipboard read denied:', error)
    elements.pgnInput.focus()
    elements.statusMessage.textContent = 'Autorise l’accès au presse-papiers, ou fais un appui long dans la zone puis « Coller ».'
  }
}

async function startAnalysis() {
  const pgn = elements.pgnInput.value.trim()
  const parsed = validatePgnInput()
  if (!parsed) {
    elements.statusMessage.textContent = 'Le PGN doit être reconnu avant de lancer l’analyse.'
    elements.pgnValidation.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  setBusy(true)
  elements.progressBar.value = 0
  elements.progressMessage.textContent = `Préparation de ${parsed.halfMoveCount + 1} positions…`
  elements.progressPercent.textContent = '0 %'
  elements.statusMessage.textContent = 'Démarrage de Stockfish sur ton appareil…'
  elements.resultsSection.hidden = true
  elements.downloadButton.disabled = true
  abortController = new AbortController()
  elements.progressArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await nextPaint()

  try {
    engine ||= new StockfishEngine()
    await engine.init()
    elements.statusMessage.textContent = 'Stockfish est prêt. Analyse coup par coup en cours…'
    await nextPaint()
    currentAnalysis = await analyzeGame({
      pgn,
      engine,
      depth: Number(elements.depthSelect.value),
      signal: abortController.signal,
      onProgress: updateProgress,
    })

    updateProgress({ current: 1, total: 1, message: 'Création de la peinture…' })
    renderPainting(elements.canvas, currentAnalysis, pgn)
    renderResults(currentAnalysis)
    elements.canvasPlaceholder.hidden = true
    elements.downloadButton.disabled = false
    elements.statusMessage.textContent = 'Analyse terminée. La même partie produira toujours la même œuvre.'
  } catch (error) {
    if (error?.name === 'AbortError') {
      elements.statusMessage.textContent = 'Analyse interrompue.'
    } else {
      console.error(error)
      elements.statusMessage.textContent = error?.message || 'Une erreur est survenue pendant l’analyse.'
    }
  } finally {
    abortController = null
    setBusy(false)
  }
}

elements.analyzeButton.addEventListener('click', startAnalysis)

elements.pasteButton.addEventListener('click', pastePgnFromClipboard)

elements.exampleButton.addEventListener('click', () => {
  elements.pgnInput.value = normalizePgn(samplePgn)
  elements.pgnInput.focus()
  elements.pgnInput.scrollLeft = 0
  validatePgnInput({ announce: true })
})

elements.clearButton.addEventListener('click', () => {
  elements.pgnInput.value = ''
  elements.pgnInput.focus()
  validatePgnInput()
  elements.statusMessage.textContent = 'Zone PGN effacée.'
})

elements.pgnInput.addEventListener('input', () => schedulePgnValidation())

elements.pgnInput.addEventListener('paste', () => {
  window.setTimeout(() => {
    elements.pgnInput.value = normalizePgn(elements.pgnInput.value)
    elements.pgnInput.scrollLeft = 0
    validatePgnInput({ announce: true })
  }, 0)
})

elements.stopButton.addEventListener('click', () => {
  abortController?.abort()
  engine?.stop()
})

elements.downloadButton.addEventListener('click', () => {
  const title = currentAnalysis?.artworkTitle || `${currentAnalysis?.headers.White || 'blancs'}-${currentAnalysis?.headers.Black || 'noirs'}`
  const clean = String(title).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  downloadPainting(elements.canvas, `chess-paint-${clean || 'oeuvre'}.png`)
})

elements.pgnFile.addEventListener('change', async () => {
  const file = elements.pgnFile.files?.[0]
  if (!file) return
  elements.pgnInput.value = normalizePgn(await file.text())
  elements.pgnInput.scrollLeft = 0
  validatePgnInput({ announce: true })
  elements.statusMessage.textContent = `Fichier chargé : ${file.name}`
})

window.addEventListener('error', (event) => {
  console.error(event.error || event.message)
  elements.statusMessage.textContent = `Erreur de l’application : ${event.message || 'cause inconnue'}`
})

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason)
  elements.statusMessage.textContent = `Erreur pendant l’analyse : ${event.reason?.message || event.reason || 'cause inconnue'}`
})

validatePgnInput()

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
  elements.installButton.hidden = false
})

elements.installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  elements.installButton.hidden = true
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  elements.installButton.hidden = true
  elements.statusMessage.textContent = 'Chess Paint est installé sur cet appareil.'
})
