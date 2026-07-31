import { BLACK, Chess, WHITE } from 'chess.js'

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3.2,
  r: 5,
  q: 9,
  k: 20,
}

const QUALITY_LABELS = {
  brilliant: 'Brillant',
  best: 'Meilleur',
  excellent: 'Excellent',
  good: 'Bon',
  inaccuracy: 'Imprécision',
  mistake: 'Erreur',
  blunder: 'Gaffe',
}

const STARTING_PIECES = {
  a1: 'r', b1: 'n', c1: 'b', d1: 'q', e1: 'k', f1: 'b', g1: 'n', h1: 'r',
  a2: 'p', b2: 'p', c2: 'p', d2: 'p', e2: 'p', f2: 'p', g2: 'p', h2: 'p',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
}

const OPENING_BOOK = [
  { id: 'ruy-lopez', label: 'Partie espagnole', family: 'Jeux ouverts', pattern: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], symbol: 'arch' },
  { id: 'italian', label: 'Partie italienne', family: 'Jeux ouverts', pattern: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], symbol: 'laurel' },
  { id: 'scotch', label: 'Partie écossaise', family: 'Jeux ouverts', pattern: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], symbol: 'crosswind' },
  { id: 'petrov', label: 'Défense Petrov', family: 'Jeux ouverts', pattern: ['e4', 'e5', 'Nf3', 'Nf6'], symbol: 'mirror' },
  { id: 'sicilian', label: 'Défense sicilienne', family: 'Jeux semi-ouverts', pattern: ['e4', 'c5'], symbol: 'wave' },
  { id: 'french', label: 'Défense française', family: 'Jeux semi-ouverts', pattern: ['e4', 'e6'], symbol: 'fan' },
  { id: 'caro-kann', label: 'Défense Caro-Kann', family: 'Jeux semi-ouverts', pattern: ['e4', 'c6'], symbol: 'gate' },
  { id: 'scandinavian', label: 'Défense scandinave', family: 'Jeux semi-ouverts', pattern: ['e4', 'd5'], symbol: 'spear' },
  { id: 'kings-gambit', label: 'Gambit du roi', family: 'Jeux ouverts', pattern: ['e4', 'e5', 'f4'], symbol: 'flame' },
  { id: 'queens-gambit', label: 'Gambit dame', family: 'Jeux fermés', pattern: ['d4', 'd5', 'c4'], symbol: 'orb' },
  { id: 'london', label: 'Système de Londres', family: 'Jeux fermés', pattern: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], symbol: 'column' },
  { id: 'english', label: 'Ouverture anglaise', family: 'Flanc', pattern: ['c4'], symbol: 'crescent' },
  { id: 'reti', label: 'Ouverture Réti', family: 'Flanc', pattern: ['Nf3', 'd5', 'g3'], symbol: 'feather' },
  { id: 'bird', label: 'Ouverture Bird', family: 'Flanc', pattern: ['f4'], symbol: 'wing' },
  { id: 'nimzo', label: 'Défense Nimzo-indienne', family: 'Indiennes', pattern: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], symbol: 'pillar' },
  { id: 'kings-indian', label: 'Défense est-indienne', family: 'Indiennes', pattern: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'], symbol: 'spire' },
  { id: 'queens-indian', label: 'Défense ouest-indienne', family: 'Indiennes', pattern: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'], symbol: 'mesh' },
  { id: 'catalan', label: 'Ouverture catalane', family: 'Jeux fermés', pattern: ['d4', 'Nf6', 'c4', 'e6', 'g3'], symbol: 'harp' },
  { id: 'larsen', label: 'Ouverture Larsen', family: 'Flanc', pattern: ['b3'], symbol: 'kite' },
]

const SCENE_WORLDS = [
  { id: 'mythic-antique', label: 'Antique mythologique', family: 'Antique', motifs: ['temples', 'colonnes', 'héros'], keywords: ['antique', 'mythe', 'temple', 'aube'] },
  { id: 'romantic-storm', label: 'Romantisme orageux', family: 'Romantique', motifs: ['mer', 'falaises', 'nuages'], keywords: ['orage', 'romance', 'écume', 'horizon'] },
  { id: 'alpine-calm', label: 'Calme alpin', family: 'Paysage', motifs: ['montagne', 'brume', 'lacs'], keywords: ['montagne', 'brume', 'repos', 'lumière'] },
  { id: 'maritime-odyssey', label: 'Odyssée maritime', family: 'Maritime', motifs: ['vagues', 'voiles', 'ports'], keywords: ['océan', 'courant', 'voile', 'marée'] },
  { id: 'desert-epic', label: 'Épopée des sables', family: 'Épique', motifs: ['dunes', 'soleil', 'ruines'], keywords: ['sable', 'mirage', 'soleil', 'poussière'] },
  { id: 'forest-legend', label: 'Légende sylvestre', family: 'Légendaire', motifs: ['forêt', 'clairières', 'bruissement'], keywords: ['forêt', 'mousse', 'clairière', 'silence'] },
  { id: 'courtly-renaissance', label: 'Cour renaissante', family: 'Renaissance', motifs: ['jardins', 'terrasses', 'arches'], keywords: ['cour', 'velours', 'balcon', 'jardin'] },
  { id: 'lunar-dream', label: 'Songe lunaire', family: 'Onirique', motifs: ['lune', 'miroirs d’eau', 'constellations'], keywords: ['lune', 'rêve', 'miroir', 'nocturne'] },
]

function hashText(text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomGenerator(seed) {
  let state = seed || 1
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function choose(array, random) {
  return array[Math.floor(random() * array.length)]
}

function normalizedHeader(value) {
  return String(value || '').trim()
}

export function normalizePgn(pgn) {
  const cleaned = String(pgn ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim()

  if (!cleaned) return ''

  const headerLines = []
  const moveLines = []

  for (const rawLine of cleaned.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('[') && line.endsWith(']') && moveLines.length === 0) {
      headerLines.push(line)
    } else {
      moveLines.push(line)
    }
  }

  const moveText = moveLines.join(' ').replace(/\s+/g, ' ').trim()

  return [headerLines.join('\n'), moveText]
    .filter(Boolean)
    .join('\n\n')
}

export function parsePgn(pgn) {
  const normalizedPgn = normalizePgn(pgn)
  if (!normalizedPgn) {
    throw new Error('La zone PGN est vide.')
  }

  const game = new Chess()
  try {
    game.loadPgn(normalizedPgn, { strict: false })
  } catch (error) {
    const detail = error?.message ? ` Détail : ${error.message}` : ''
    throw new Error(`Le texte collé n’est pas reconnu comme une partie PGN valide.${detail}`)
  }

  const moves = game.history({ verbose: true })
  if (!moves.length) {
    throw new Error('Le PGN ne contient aucun coup exploitable.')
  }

  const headers = game.getHeaders()
  const resultMatch = normalizedPgn.match(/(?:^|\s)(1-0|0-1|1\/2-1\/2|\*)\s*$/)

  return {
    normalizedPgn,
    headers,
    moves,
    finalFen: game.fen(),
    result: headers.Result || resultMatch?.[1] || '*',
    halfMoveCount: moves.length,
    displayedMoveCount: Math.ceil(moves.length / 2),
  }
}

function uciOf(move) {
  return `${move.from}${move.to}${move.promotion || ''}`
}

function moverPerspective(scoreWhite, color) {
  return color === 'w' ? scoreWhite : -scoreWhite
}

function likelySacrifice(move, cpLoss) {
  if (cpLoss > 80 || move.piece === 'k') return false

  const board = new Chess(move.after)
  const opponent = move.color === 'w' ? BLACK : WHITE
  const movedPieceValue = PIECE_VALUES[move.piece] || 0
  const capturedValue = PIECE_VALUES[move.captured] || 0

  return (
    movedPieceValue >= capturedValue + 2 &&
    board.isAttacked(move.to, opponent)
  )
}

function classifyMove(move, before, after) {
  const beforeForMover = moverPerspective(before.scoreWhite, move.color)
  const afterForMover = moverPerspective(after.scoreWhite, move.color)
  const cpLoss = Math.max(0, beforeForMover - afterForMover)
  const isEngineBest = before.bestMove === uciOf(move)
  const sacrifice = likelySacrifice(move, cpLoss)

  let quality
  if (sacrifice && isEngineBest && cpLoss <= 18) quality = 'brilliant'
  else if (isEngineBest && cpLoss <= 30) quality = 'best'
  else if (cpLoss <= 25) quality = 'excellent'
  else if (cpLoss <= 70) quality = 'good'
  else if (cpLoss <= 140) quality = 'inaccuracy'
  else if (cpLoss <= 280) quality = 'mistake'
  else quality = 'blunder'

  return {
    quality,
    qualityLabel: QUALITY_LABELS[quality],
    cpLoss: Math.round(cpLoss),
    accuracy: Math.max(0, Math.min(100, Math.round(100 * Math.exp(-cpLoss / 180)))),
    isEngineBest,
    sacrifice,
  }
}

function detectMotifs(move, classification, moveIndex, moves) {
  const motifs = []
  const flags = move.flags || ''

  if (move.san.includes('#')) motifs.push('mat')
  else if (move.san.includes('+')) motifs.push('échec')
  if (move.captured) motifs.push('capture')
  if (flags.includes('k') || flags.includes('q')) motifs.push('roque')
  if (move.promotion) motifs.push('promotion')
  if (classification.sacrifice) motifs.push('sacrifice potentiel')

  const recentChecks = moves
    .slice(Math.max(0, moveIndex - 5), moveIndex + 1)
    .filter((item) => item.san.includes('+') || item.san.includes('#')).length
  if (recentChecks >= 2) motifs.push('attaque du roi')

  return motifs
}

function moveImportance(row, totalMoves) {
  const quality = {
    brilliant: 26,
    best: 19,
    excellent: 15,
    good: 10,
    inaccuracy: 7,
    mistake: 16,
    blunder: 22,
  }[row.quality] || 8
  const capturedValue = PIECE_VALUES[row.captured] || 0
  const event = (row.captured ? 9 + capturedValue * 1.35 : 0)
    + (row.motifs.includes('échec') ? 14 : 0)
    + (row.motifs.includes('mat') ? 34 : 0)
    + (row.motifs.includes('promotion') ? 24 : 0)
    + (row.sacrifice ? 18 : 0)
  const swing = Math.min(24, Math.sqrt(Math.max(0, row.cpLoss)) * 1.25)
  const central = /[c-f][3-6]/.test(row.to) ? 5 : 0
  const finale = row.index >= Math.max(0, totalMoves - 8) ? 6 : 0
  return Math.round(Math.max(0, Math.min(100, quality + event + swing + central + finale)))
}

export function trackPieces(moves, rows = []) {
  const board = new Map()
  const pieces = []
  const counters = { w: {}, b: {} }

  for (const [square, type] of Object.entries(STARTING_PIECES)) {
    const color = square[1] <= '2' ? 'w' : 'b'
    counters[color][type] = (counters[color][type] || 0) + 1
    const piece = {
      id: `${color}${type}${counters[color][type]}`,
      color,
      type,
      startType: type,
      startSquare: square,
      finalSquare: square,
      moveCount: 0,
      captures: 0,
      materialCaptured: 0,
      checks: 0,
      wasCaptured: false,
      moveOfCapture: null,
      participatedInMate: false,
      sacrificed: false,
      importance: 0,
      moveIndices: [],
    }
    pieces.push(piece)
    board.set(square, piece)
  }

  const rowPieceIds = []
  moves.forEach((move, index) => {
    const piece = board.get(move.from)
    if (!piece) return

    let capturedSquare = move.to
    if ((move.flags || '').includes('e')) {
      capturedSquare = `${move.to[0]}${Number(move.to[1]) + (move.color === 'w' ? -1 : 1)}`
    }
    const captured = board.get(capturedSquare)
    if (captured && captured.color !== piece.color) {
      captured.wasCaptured = true
      captured.moveOfCapture = index
      captured.finalSquare = capturedSquare
      board.delete(capturedSquare)
      piece.captures += 1
      piece.materialCaptured += PIECE_VALUES[captured.type] || 0
    }

    board.delete(move.from)
    board.set(move.to, piece)
    piece.finalSquare = move.to
    piece.moveCount += 1
    piece.moveIndices.push(index)
    if (move.san.includes('+') || move.san.includes('#')) piece.checks += 1
    if (move.san.includes('#')) piece.participatedInMate = true
    if (move.promotion) piece.type = move.promotion

    if ((move.flags || '').includes('k') || (move.flags || '').includes('q')) {
      const kingSide = (move.flags || '').includes('k')
      const rank = move.color === 'w' ? '1' : '8'
      const rookFrom = `${kingSide ? 'h' : 'a'}${rank}`
      const rookTo = `${kingSide ? 'f' : 'd'}${rank}`
      const rook = board.get(rookFrom)
      if (rook) {
        board.delete(rookFrom)
        board.set(rookTo, rook)
        rook.finalSquare = rookTo
        rook.moveCount += 1
        rook.moveIndices.push(index)
      }
    }

    rowPieceIds[index] = piece.id
  })

  for (const piece of pieces) {
    const pieceRows = piece.moveIndices.map((index) => rows[index]).filter(Boolean)
    const rowImpact = pieceRows.reduce((sum, row) => sum + (row.importance || 0), 0)
    piece.sacrificed = piece.wasCaptured && pieceRows.some((row) => row.sacrifice)
    piece.importance = Math.round(
      piece.moveCount * 2.4
      + piece.captures * 8
      + piece.materialCaptured * 2.2
      + piece.checks * 8
      + (piece.participatedInMate ? 28 : 0)
      + (piece.sacrificed ? 16 : 0)
      + rowImpact * 0.12,
    )
  }

  return {
    pieces: pieces.sort((a, b) => b.importance - a.importance),
    rowPieceIds,
  }
}

function estimatePlayerLevel(rows, color) {
  const playerRows = rows.filter((row) => row.color === color)
  if (!playerRows.length) return null

  const averageLoss = playerRows.reduce((sum, row) => sum + Math.min(row.cpLoss, 800), 0) / playerRows.length
  const bestRate = playerRows.filter((row) => ['brilliant', 'best', 'excellent'].includes(row.quality)).length / playerRows.length
  const blunderRate = playerRows.filter((row) => row.quality === 'blunder').length / playerRows.length
  const estimated = Math.round(
    Math.max(500, Math.min(2500, 2150 - averageLoss * 3.8 + bestRate * 420 - blunderRate * 500)),
  )
  const low = Math.max(400, Math.floor((estimated - 150) / 100) * 100)
  const high = Math.min(2700, Math.ceil((estimated + 150) / 100) * 100)

  return {
    averageLoss: Math.round(averageLoss),
    bestRate: Math.round(bestRate * 100),
    blunders: playerRows.filter((row) => row.quality === 'blunder').length,
    estimated,
    range: `${low}–${high}`,
  }
}

function cleanSanMove(san) {
  return san.replace(/[+#?!]/g, '')
}

function detectOpening(parsed) {
  if (parsed.headers.Opening) {
    return {
      id: 'header-opening',
      label: parsed.headers.Opening,
      family: parsed.headers.ECO || 'Ouverture renseignée',
      symbol: 'orb',
    }
  }

  const sanMoves = parsed.moves.map((move) => cleanSanMove(move.san))
  const lowerSan = sanMoves.map((move) => move.toLowerCase())

  for (const opening of OPENING_BOOK) {
    const matches = opening.pattern.every((move, index) => lowerSan[index] === move.toLowerCase())
    if (matches) return opening
  }

  if (lowerSan[0] === 'e4' && lowerSan[1] === 'e5') {
    return { id: 'open-game', label: 'Jeu ouvert', family: 'Ouverture', symbol: 'arch' }
  }
  if (lowerSan[0] === 'd4' && lowerSan[1] === 'd5') {
    return { id: 'closed-game', label: 'Jeu fermé', family: 'Ouverture', symbol: 'mesh' }
  }
  if (lowerSan[0] === 'd4' && lowerSan[1] === 'nf6') {
    return { id: 'indian-game', label: 'Défense indienne', family: 'Ouverture', symbol: 'spire' }
  }

  return {
    id: 'unknown-opening',
    label: 'Ouverture libre',
    family: 'Non identifiée',
    symbol: 'spiral',
  }
}

function winnerColor(result) {
  if (result === '1-0') return 'w'
  if (result === '0-1') return 'b'
  return null
}

function determineTheme(rows, moves, evaluations, result) {
  const checks = moves.filter((move) => move.san.includes('+') || move.san.includes('#')).length
  const captures = moves.filter((move) => move.captured).length
  const promotions = moves.filter((move) => move.promotion).length
  const severeErrors = rows.filter((row) => ['mistake', 'blunder'].includes(row.quality)).length
  const sacrifices = rows.filter((row) => row.sacrifice).length
  const maxSwing = Math.max(...rows.map((row) => row.cpLoss), 0)
  const finalBoard = new Chess(moves.at(-1).after)
  const material = finalBoard.board().flat().filter(Boolean).length
  const earlyMoves = moves.slice(0, Math.min(20, moves.length))
  const earlyCenterPawnMoves = earlyMoves.filter((move) => move.piece === 'p' && /[cdef]/.test(move.from[0])).length
  const wingMoves = earlyMoves.filter((move) => /[abgh]/.test(move.from[0]) || /[abgh]/.test(move.to[0])).length
  const quietStructure = checks <= 1 && captures <= 5 && severeErrors <= 1
  const evalScores = evaluations.map((entry) => entry.scoreWhite)
  const signChanges = evalScores.reduce((count, score, index, array) => {
    if (index === 0) return 0
    const previous = array[index - 1]
    if (Math.abs(score) < 120 || Math.abs(previous) < 120) return count
    return Math.sign(score) !== Math.sign(previous) ? count + 1 : count
  }, 0)
  const winner = winnerColor(result)
  const bestForBlack = Math.max(...evalScores)
  const bestForWhite = Math.min(...evalScores)
  const comeback = (winner === 'w' && bestForWhite < -220) || (winner === 'b' && bestForBlack > 220)

  if (promotions >= 1) {
    return { id: 'promotion', label: 'Ascension et métamorphose', description: 'Le récit s’étire vers la transformation : la matière grimpe et change de nature.' }
  }
  if (rows.some((row) => row.motifs.includes('mat')) && checks >= 4) {
    return { id: 'king-storm', label: 'Tempête sur le roi', description: 'Les lignes se resserrent, frappent le centre nerveux et finissent par l’encercler.' }
  }
  if (sacrifices >= 1 && checks >= 2) {
    return { id: 'sacrifice', label: 'Sacrifice et initiative', description: 'Une part de matière est livrée pour ouvrir l’espace, accélérer le souffle et tendre la toile.' }
  }
  if (comeback || signChanges >= 2) {
    return { id: 'counterstroke', label: 'Renversement et contre-attaque', description: 'La direction dominante bascule : une force dominée revient, casse le rythme et s’impose à rebours.' }
  }
  if (earlyCenterPawnMoves >= 8 && captures >= 4) {
    return { id: 'center-clash', label: 'Choc au centre', description: 'Le centre de l’échiquier devient la scène première : la toile se construit dans une compression frontale.' }
  }
  if (wingMoves >= 8 && checks <= 3) {
    return { id: 'wing-race', label: 'Course sur les ailes', description: 'Les gestes glissent vers les bords, contournent le cœur de la position et dessinent des trajectoires latérales.' }
  }
  if (severeErrors >= 4 || maxSwing >= 500) {
    return { id: 'chaos', label: 'Chaos tactique', description: 'La partie change brutalement de direction et laisse des cassures, des éclats et des reprises soudaines.' }
  }
  if (material <= 10) {
    return { id: 'endgame', label: 'Finale mécanique', description: 'Peu de matière subsiste : les gestes deviennent rares, précis, presque architecturaux.' }
  }
  if (captures >= Math.max(8, moves.length * 0.3)) {
    return { id: 'exchange', label: 'Érosion par les échanges', description: 'Les formes se superposent puis s’effacent au rythme des prises successives.' }
  }
  if (quietStructure) {
    return { id: 'fortress', label: 'Forteresse et tension sourde', description: 'La structure résiste longtemps : la surface paraît calme mais chaque ligne contient une pression retenue.' }
  }
  if (checks <= 2 && severeErrors <= 2) {
    return { id: 'positional', label: 'Construction positionnelle', description: 'La toile progresse par ajustements fins, glissements et compensations patientes.' }
  }
  return { id: 'duel', label: 'Duel de trajectoires', description: 'Deux logiques visuelles se répondent et se déforment l’une l’autre jusqu’à l’issue de la partie.' }
}

function selectSceneWorld(theme, opening, rows, normalizedPgn) {
  const seed = hashText(`${normalizedPgn}|scene|${theme.id}|${opening.id}`)
  const random = randomGenerator(seed)
  const map = {
    'king-storm': ['romantic-storm', 'maritime-odyssey', 'mythic-antique'],
    sacrifice: ['mythic-antique', 'desert-epic', 'romantic-storm'],
    chaos: ['romantic-storm', 'desert-epic', 'forest-legend'],
    endgame: ['alpine-calm', 'courtly-renaissance', 'lunar-dream'],
    exchange: ['courtly-renaissance', 'alpine-calm', 'forest-legend'],
    positional: ['alpine-calm', 'courtly-renaissance', 'lunar-dream'],
    duel: ['mythic-antique', 'courtly-renaissance', 'forest-legend'],
    counterstroke: ['maritime-odyssey', 'romantic-storm', 'desert-epic'],
    'center-clash': ['mythic-antique', 'desert-epic', 'courtly-renaissance'],
    'wing-race': ['maritime-odyssey', 'alpine-calm', 'lunar-dream'],
    fortress: ['alpine-calm', 'courtly-renaissance', 'forest-legend'],
    promotion: ['lunar-dream', 'mythic-antique', 'romantic-storm'],
  }
  const candidates = map[theme.id] || SCENE_WORLDS.map((world) => world.id)
  const weighted = [...candidates, ...SCENE_WORLDS.map((world) => world.id)]
  const selectedId = choose(weighted, random)
  return SCENE_WORLDS.find((world) => world.id === selectedId) || SCENE_WORLDS[0]
}

function generateArtworkTitle({ normalizedPgn, theme, opening, scene, result }) {
  const seed = hashText(`${normalizedPgn}|title|${theme.id}|${scene.id}`)
  const random = randomGenerator(seed)
  const starters = ['La', 'Le', 'Les', 'Ballade de', 'Élégie pour', 'Chronique de', 'Au bord de', 'Sous', 'Par-delà']
  const nounsByTheme = {
    'king-storm': ['couronne d’orage', 'siège du roi', 'dernier rempart'],
    sacrifice: ['don du feu', 'offrande des lignes', 'cœur livré'],
    chaos: ['cartographie des éclats', 'danse des fractures', 'bruit des cendres'],
    endgame: ['mécanique du silence', 'fin des leviers', 'géométrie du soir'],
    exchange: ['poussière des échanges', 'érosion des présences', 'balancier des pertes'],
    positional: ['patience des pierres', 'atelier des distances', 'mesure des espaces'],
    duel: ['duel de trajectoires', 'conversation des forces', 'équilibre rompu'],
    counterstroke: ['retour de la marée', 'contre-chant des lignes', 'retournement du vent'],
    'center-clash': ['cœur de la mêlée', 'compression du centre', 'forge centrale'],
    'wing-race': ['course latérale', 'danse des rivages', 'appel des ailes'],
    fortress: ['forteresse intérieure', 'tension immobile', 'silence des remparts'],
    promotion: ['ascension de l’étincelle', 'couronnement du pion', 'métamorphose en hauteur'],
  }
  const sceneWords = scene.keywords
  const openingWord = opening.label.replace(/^Défense\s+/i, '').replace(/^Partie\s+/i, '').toLowerCase()
  const closer = choose(['nocturne', 'horizon', 'brume', 'marée', 'éclaircie', 'vertige'], random)
  const body = choose(nounsByTheme[theme.id] || nounsByTheme.duel, random)
  const intro = choose(starters, random)
  const twist = random() > 0.45 ? ` ${choose(['de', 'dans', 'sous', 'vers'], random)} ${choose(sceneWords, random)}` : ''
  const openingHint = random() > 0.62 ? ` · ${openingWord}` : ''
  const resultHint = result === '1/2-1/2'
    ? ' — équilibre'
    : random() > 0.7
      ? ` — ${choose([closer, choose(sceneWords, random)], random)}`
      : ''

  return `${intro} ${body}${twist}${openingHint}${resultHint}`.replace(/\s+/g, ' ').trim()
}

function createCommentary(theme, rows, parsed, opening, scene, title) {
  const firstTurningPoint = rows.find((row) => row.cpLoss >= 180)
  const winner = parsed.result === '1-0'
    ? normalizedHeader(parsed.headers.White) || 'Les Blancs'
    : parsed.result === '0-1'
      ? normalizedHeader(parsed.headers.Black) || 'Les Noirs'
      : null

  const parts = []
  parts.push(`Titre généré : « ${title} ».`)
  if (opening?.label) parts.push(`L’œuvre s’appuie sur ${opening.label.toLowerCase()} et la transpose dans un univers ${scene.label.toLowerCase()}.`)
  parts.push(theme.description)
  if (firstTurningPoint) {
    parts.push(`Le premier grand basculement apparaît au ${firstTurningPoint.moveNumber}${firstTurningPoint.color === 'w' ? 'e' : '…'} coup avec ${firstTurningPoint.san}.`)
  }
  if (winner) parts.push(`${winner} impose finalement la direction dominante de la composition.`)
  else if (parsed.result === '1/2-1/2') parts.push('Aucune trajectoire ne parvient à absorber complètement l’autre et la toile reste en équilibre.')

  return parts.join(' ')
}

export async function analyzeGame({ pgn, engine, depth, signal, onProgress }) {
  const parsed = parsePgn(pgn)
  const positions = [parsed.moves[0].before, ...parsed.moves.map((move) => move.after)]
  const evaluations = []

  for (let index = 0; index < positions.length; index += 1) {
    if (signal?.aborted) throw new DOMException('Analyse interrompue', 'AbortError')
    onProgress?.({
      current: index,
      total: positions.length,
      message: `Analyse de la position ${index + 1}/${positions.length}`,
    })
    evaluations.push(await engine.analyzeFen(positions[index], depth, signal))
  }

  const rows = parsed.moves.map((move, index) => {
    const classification = classifyMove(move, evaluations[index], evaluations[index + 1])
    const motifs = detectMotifs(move, classification, index, parsed.moves)
    const row = {
      index,
      moveNumber: Math.floor(index / 2) + 1,
      color: move.color,
      san: move.san,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured || null,
      promotion: move.promotion || null,
      beforeFen: move.before,
      afterFen: move.after,
      evalBefore: evaluations[index].scoreWhite,
      evalAfter: evaluations[index + 1].scoreWhite,
      bestMove: evaluations[index].bestMove,
      principalVariation: evaluations[index].principalVariation,
      motifs,
      ...classification,
    }
    row.importance = moveImportance(row, parsed.moves.length)
    return row
  })

  const pieceTracking = trackPieces(parsed.moves, rows)
  rows.forEach((row, index) => {
    row.pieceId = pieceTracking.rowPieceIds[index] || `${row.color}${row.piece}`
  })

  const theme = determineTheme(rows, parsed.moves, evaluations, parsed.result)
  const white = estimatePlayerLevel(rows, 'w')
  const black = estimatePlayerLevel(rows, 'b')
  const opening = detectOpening(parsed)
  const scene = selectSceneWorld(theme, opening, rows, parsed.normalizedPgn)
  const artworkTitle = generateArtworkTitle({
    normalizedPgn: parsed.normalizedPgn,
    theme,
    opening,
    scene,
    result: parsed.result,
  })

  return {
    ...parsed,
    rows,
    pieces: pieceTracking.pieces,
    evaluations,
    players: { white, black },
    theme,
    opening,
    scene,
    artworkTitle,
    commentary: createCommentary(theme, rows, parsed, opening, scene, artworkTitle),
  }
}
