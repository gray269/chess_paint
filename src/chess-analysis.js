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

export function normalizePgn(pgn) {
  const cleaned = String(pgn ?? '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[\u00A0\u202F]/g, ' ')
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

  // Les retours à la ligne, tabulations et espaces multiples du texte des coups
  // deviennent de simples séparateurs. Cela rend le collage mobile beaucoup plus robuste.
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

function determineTheme(rows, moves) {
  const checks = moves.filter((move) => move.san.includes('+') || move.san.includes('#')).length
  const captures = moves.filter((move) => move.captured).length
  const severeErrors = rows.filter((row) => ['mistake', 'blunder'].includes(row.quality)).length
  const sacrifices = rows.filter((row) => row.sacrifice).length
  const maxSwing = Math.max(...rows.map((row) => row.cpLoss), 0)
  const finalBoard = new Chess(moves.at(-1).after)
  const material = finalBoard.board().flat().filter(Boolean).length

  if (rows.some((row) => row.motifs.includes('mat')) && checks >= 4) {
    return { id: 'king-storm', label: 'Tempête sur le roi', description: 'Les lignes convergent vers le roi et la toile se referme autour de lui.' }
  }
  if (sacrifices >= 1 && checks >= 2) {
    return { id: 'sacrifice', label: 'Sacrifice et initiative', description: 'La matière est abandonnée pour accélérer le mouvement et ouvrir les lignes.' }
  }
  if (severeErrors >= 4 || maxSwing >= 500) {
    return { id: 'chaos', label: 'Chaos tactique', description: 'La partie change brutalement de direction et laisse des ruptures dans la peinture.' }
  }
  if (material <= 10) {
    return { id: 'endgame', label: 'Finale mécanique', description: 'Peu de pièces subsistent : les gestes deviennent rares, précis et structurés.' }
  }
  if (captures >= Math.max(8, moves.length * 0.3)) {
    return { id: 'exchange', label: 'Érosion par les échanges', description: 'Les formes se superposent puis disparaissent au rythme des captures.' }
  }
  if (checks <= 2 && severeErrors <= 2) {
    return { id: 'positional', label: 'Construction positionnelle', description: 'La toile progresse par petites tensions, sans explosion immédiate.' }
  }
  return { id: 'duel', label: 'Duel de trajectoires', description: 'Deux logiques visuelles se répondent jusqu’à l’issue de la partie.' }
}

function createCommentary(theme, rows, parsed) {
  const firstTurningPoint = rows.find((row) => row.cpLoss >= 180)
  const winner = parsed.result === '1-0'
    ? parsed.headers.White || 'Les Blancs'
    : parsed.result === '0-1'
      ? parsed.headers.Black || 'Les Noirs'
      : null

  const parts = [theme.description]
  if (firstTurningPoint) {
    parts.push(
      `Le premier grand basculement apparaît au ${firstTurningPoint.moveNumber}${firstTurningPoint.color === 'w' ? 'e' : '…'} coup avec ${firstTurningPoint.san}.`,
    )
  }
  if (winner) parts.push(`${winner} impose finalement la direction dominante de l’œuvre.`)
  else if (parsed.result === '1/2-1/2') parts.push('Aucune trajectoire ne parvient à absorber complètement l’autre.')

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
    return {
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
  })

  const theme = determineTheme(rows, parsed.moves)
  const white = estimatePlayerLevel(rows, 'w')
  const black = estimatePlayerLevel(rows, 'b')

  return {
    ...parsed,
    rows,
    evaluations,
    players: { white, black },
    theme,
    commentary: createCommentary(theme, rows, parsed),
  }
}
