const SIZE = 1400
const MARGIN = 110
const BOARD_SIZE = SIZE - MARGIN * 2
const CELL = BOARD_SIZE / 8

const WHITE_COLOR = '#f2b661'
const BLACK_COLOR = '#5f86d6'
const CONFLICT_COLOR = '#e96f5b'
const PRESSURE_COLOR = '#f4e39d'
const CHAOS_COLOR = '#bb79ff'
const PROMOTION_COLOR = '#79e5d6'
const BOARD_DARK = '#161b25'
const BOARD_LIGHT = '#202737'
const LABEL_COLOR = '#cfc7b5'

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const bigint = Number.parseInt(value, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixColors(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return `rgb(${Math.round(a.r * (1 - weight) + b.r * weight)}, ${Math.round(a.g * (1 - weight) + b.g * weight)}, ${Math.round(a.b * (1 - weight) + b.b * weight)})`
}

function interpolateColors(hexA, hexB, t) {
  return mixColors(hexA, hexB, clamp(t, 0, 1))
}

function squareToCoords(square) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return { file, rank }
}

function squareName(file, rank) {
  return `${String.fromCharCode(97 + file)}${rank + 1}`
}

function cellRect(file, rank) {
  const x = MARGIN + file * CELL
  const y = MARGIN + (7 - rank) * CELL
  return { x, y, cx: x + CELL / 2, cy: y + CELL / 2 }
}

function qualityWeight(row) {
  switch (row.quality) {
    case 'brilliant': return 2.5
    case 'best': return 2.1
    case 'excellent': return 1.7
    case 'good': return 1.25
    case 'inaccuracy': return 1.1
    case 'mistake': return 1.35
    case 'blunder': return 1.8
    default: return 1
  }
}

function createMatrix(fill = 0) {
  return Array.from({ length: 8 }, () => Array(8).fill(fill))
}

function normalizeMatrix(matrix) {
  const max = Math.max(...matrix.flat(), 0.0001)
  return matrix.map((row) => row.map((value) => value / max))
}

function sumMatrix(matrix) {
  return matrix.flat().reduce((sum, value) => sum + value, 0)
}

function addToMatrix(matrix, file, rank, value) {
  matrix[file][rank] += value
}

function heatRampColor(intensity) {
  const value = clamp(intensity, 0, 1)
  const stops = [
    { stop: 0, color: '#31bf67' },
    { stop: 0.35, color: '#e0d548' },
    { stop: 0.68, color: '#f19a32' },
    { stop: 1, color: '#dc4134' },
  ]
  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = stops[index]
    const end = stops[index + 1]
    if (value >= start.stop && value <= end.stop) {
      const localT = (value - start.stop) / (end.stop - start.stop)
      return interpolateColors(start.color, end.color, localT)
    }
  }
  return stops.at(-1).color
}

function viridisColor(intensity) {
  const value = clamp(intensity, 0, 1)
  const stops = [
    { stop: 0, color: '#482878' },
    { stop: 0.25, color: '#365c8d' },
    { stop: 0.5, color: '#277f8e' },
    { stop: 0.75, color: '#55c667' },
    { stop: 1, color: '#fde725' },
  ]
  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = stops[index]
    const end = stops[index + 1]
    if (value >= start.stop && value <= end.stop) {
      const localT = (value - start.stop) / (end.stop - start.stop)
      return interpolateColors(start.color, end.color, localT)
    }
  }
  return stops.at(-1).color
}

function conflictRamp(intensity) {
  const value = clamp(intensity, 0, 1)
  const stops = [
    { stop: 0, color: '#1a2030' },
    { stop: 0.35, color: '#7f325f' },
    { stop: 0.7, color: '#de5b43' },
    { stop: 1, color: '#ffd166' },
  ]
  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = stops[index]
    const end = stops[index + 1]
    if (value >= start.stop && value <= end.stop) {
      const localT = (value - start.stop) / (end.stop - start.stop)
      return interpolateColors(start.color, end.color, localT)
    }
  }
  return stops.at(-1).color
}

function pressureRamp(intensity) {
  const value = clamp(intensity, 0, 1)
  const stops = [
    { stop: 0, color: '#17213a' },
    { stop: 0.4, color: '#225b84' },
    { stop: 0.75, color: '#37b3c8' },
    { stop: 1, color: '#fff1a8' },
  ]
  for (let index = 0; index < stops.length - 1; index += 1) {
    const start = stops[index]
    const end = stops[index + 1]
    if (value >= start.stop && value <= end.stop) {
      const localT = (value - start.stop) / (end.stop - start.stop)
      return interpolateColors(start.color, end.color, localT)
    }
  }
  return stops.at(-1).color
}

function combinedIntensity(matrices, file, rank) {
  const { total, white, black, conflict, pressure, chaos } = matrices
  return total[file][rank] + white[file][rank] + black[file][rank] + conflict[file][rank] * 1.3 + pressure[file][rank] * 1.5 + chaos[file][rank] * 1.15
}

export function buildHeatmapData(analysis) {
  const total = createMatrix(0)
  const white = createMatrix(0)
  const black = createMatrix(0)
  const conflict = createMatrix(0)
  const pressure = createMatrix(0)
  const chaos = createMatrix(0)
  const visits = createMatrix(0)
  const captures = createMatrix(0)
  const checks = createMatrix(0)
  const mates = createMatrix(0)
  const promotions = createMatrix(0)
  const mistakes = createMatrix(0)
  const blunders = createMatrix(0)
  const sacrifices = createMatrix(0)
  const eventSquares = []

  for (const row of analysis.rows) {
    const from = squareToCoords(row.from)
    const to = squareToCoords(row.to)
    const sideMatrix = row.color === 'w' ? white : black
    const q = qualityWeight(row)

    addToMatrix(total, from.file, from.rank, 0.35 * q)
    addToMatrix(total, to.file, to.rank, 1.2 * q)
    addToMatrix(sideMatrix, from.file, from.rank, 0.25 * q)
    addToMatrix(sideMatrix, to.file, to.rank, 1.35 * q)
    addToMatrix(visits, to.file, to.rank, 1)

    if (row.captured) {
      addToMatrix(conflict, to.file, to.rank, 2.8 + q * 0.8)
      addToMatrix(total, to.file, to.rank, 1.6)
      addToMatrix(captures, to.file, to.rank, 1)
      eventSquares.push({ type: 'capture', square: row.to, strength: 1.8 + q * 0.35 })
    }
    if (row.motifs.includes('échec')) {
      addToMatrix(pressure, to.file, to.rank, 3.8 + q * 0.9)
      addToMatrix(checks, to.file, to.rank, 1)
      eventSquares.push({ type: 'check', square: row.to, strength: 2.6 + q * 0.45 })
    }
    if (row.motifs.includes('mat')) {
      addToMatrix(pressure, to.file, to.rank, 7.5 + q)
      addToMatrix(conflict, to.file, to.rank, 1.5)
      addToMatrix(mates, to.file, to.rank, 1)
      eventSquares.push({ type: 'mate', square: row.to, strength: 4.5 })
    }
    if (row.motifs.includes('promotion')) {
      addToMatrix(pressure, to.file, to.rank, 2.6)
      addToMatrix(total, to.file, to.rank, 1.4)
      addToMatrix(promotions, to.file, to.rank, 1)
      eventSquares.push({ type: 'promotion', square: row.to, strength: 2.2 })
    }
    if (row.quality === 'mistake' || row.quality === 'blunder') {
      addToMatrix(chaos, to.file, to.rank, row.quality === 'blunder' ? 3.2 : 1.9)
      if (row.quality === 'blunder') addToMatrix(blunders, to.file, to.rank, 1)
      else addToMatrix(mistakes, to.file, to.rank, 1)
      eventSquares.push({ type: row.quality, square: row.to, strength: row.quality === 'blunder' ? 2.4 : 1.4 })
    }
    if (row.sacrifice) {
      addToMatrix(conflict, to.file, to.rank, 2.1)
      addToMatrix(pressure, to.file, to.rank, 1.2)
      addToMatrix(sacrifices, to.file, to.rank, 1)
      eventSquares.push({ type: 'sacrifice', square: row.to, strength: 2.5 })
    }
  }

  const matrices = {
    total: normalizeMatrix(total),
    white: normalizeMatrix(white),
    black: normalizeMatrix(black),
    conflict: normalizeMatrix(conflict),
    pressure: normalizeMatrix(pressure),
    chaos: normalizeMatrix(chaos),
  }

  const counts = { visits, captures, checks, mates, promotions, mistakes, blunders, sacrifices }

  const hotspots = []
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      hotspots.push({
        square: squareName(file, rank),
        intensity: combinedIntensity(matrices, file, rank),
        total: matrices.total[file][rank],
        white: matrices.white[file][rank],
        black: matrices.black[file][rank],
        conflict: matrices.conflict[file][rank],
        pressure: matrices.pressure[file][rank],
        chaos: matrices.chaos[file][rank],
        visits: visits[file][rank],
        captureCount: captures[file][rank],
        checkCount: checks[file][rank],
        mateCount: mates[file][rank],
        promotionCount: promotions[file][rank],
      })
    }
  }
  hotspots.sort((a, b) => b.intensity - a.intensity)

  const centerSquares = new Set(['d4', 'e4', 'd5', 'e5', 'c4', 'f4', 'c5', 'f5'])
  const centerTotal = hotspots.filter((entry) => centerSquares.has(entry.square)).reduce((sum, entry) => sum + entry.intensity, 0)
  const totalEnergy = hotspots.reduce((sum, entry) => sum + entry.intensity, 0) || 1
  const centerShare = Math.round((centerTotal / totalEnergy) * 100)

  const whitePressure = sumMatrix(white)
  const blackPressure = sumMatrix(black)
  const dominantSide = Math.abs(whitePressure - blackPressure) < 0.12 * (whitePressure + blackPressure)
    ? 'Équilibre'
    : whitePressure > blackPressure ? 'Blancs' : 'Noirs'

  return {
    matrices,
    counts,
    hotspots,
    eventSquares,
    centerShare,
    dominantSide,
    whitePressure,
    blackPressure,
  }
}

export function describeHeatmap(analysis, heatmapData, mode) {
  const top = heatmapData.hotspots.slice(0, 3).map((entry) => entry.square)
  const topConflict = [...heatmapData.hotspots]
    .sort((a, b) => (b.conflict + b.pressure + b.chaos) - (a.conflict + a.pressure + a.chaos))
    .slice(0, 2)
    .map((entry) => entry.square)
  const modeLabels = {
    activity: 'Activité globale',
    camps: 'Blancs vs Noirs',
    conflicts: 'Conflits et captures',
    pressure: 'Pression et échecs',
    smoothed: 'Carte lissée',
  }
  const title = `Carte thermique — ${modeLabels[mode] || 'Analyse spatiale'}`
  const commentary = [
    `Les principaux hotspots sont ${top.join(', ')}.`,
    `Le centre concentre environ ${heatmapData.centerShare} % de l’activité spatiale.`,
    `La dynamique d’ensemble penche vers : ${heatmapData.dominantSide}.`,
    topConflict.length ? `Les tensions les plus fortes apparaissent autour de ${topConflict.join(' et ')}.` : '',
  ].filter(Boolean).join(' ')

  return {
    title,
    commentary,
    modeLabel: modeLabels[mode] || 'Analyse spatiale',
    dominantSide: heatmapData.dominantSide,
    hotspots: top,
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function drawBackground(ctx, random) {
  const gradient = ctx.createLinearGradient(0, 0, 0, SIZE)
  gradient.addColorStop(0, '#0c1018')
  gradient.addColorStop(1, '#060910')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  for (let i = 0; i < 2000; i += 1) {
    const alpha = 0.004 + random() * 0.015
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(random() * SIZE, random() * SIZE, 1 + random() * 2, 1 + random() * 2)
  }
  ctx.restore()
}

function drawBoardBase(ctx, opacity = 1) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#0f1420'
  roundRect(ctx, MARGIN - 18, MARGIN - 18, BOARD_SIZE + 36, BOARD_SIZE + 36, 24)
  ctx.fill()

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y } = cellRect(file, rank)
      ctx.fillStyle = (file + rank) % 2 === 0 ? BOARD_LIGHT : BOARD_DARK
      ctx.fillRect(x, y, CELL, CELL)
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.065)'
  ctx.lineWidth = 1
  for (let file = 0; file <= 8; file += 1) {
    const x = MARGIN + file * CELL
    ctx.beginPath(); ctx.moveTo(x, MARGIN); ctx.lineTo(x, MARGIN + BOARD_SIZE); ctx.stroke()
  }
  for (let rank = 0; rank <= 8; rank += 1) {
    const y = MARGIN + rank * CELL
    ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(MARGIN + BOARD_SIZE, y); ctx.stroke()
  }

  ctx.fillStyle = LABEL_COLOR
  ctx.font = '18px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let file = 0; file < 8; file += 1) {
    const x = MARGIN + file * CELL + CELL / 2
    ctx.fillText(String.fromCharCode(97 + file), x, MARGIN + BOARD_SIZE + 30)
    ctx.fillText(String.fromCharCode(97 + file), x, MARGIN - 30)
  }
  for (let rank = 0; rank < 8; rank += 1) {
    const y = MARGIN + (7 - rank) * CELL + CELL / 2
    ctx.fillText(String(rank + 1), MARGIN - 30, y)
    ctx.fillText(String(rank + 1), MARGIN + BOARD_SIZE + 30, y)
  }
  ctx.restore()
}

function drawCellShell(ctx, x, y, fillStyle, borderStyle = 'rgba(255,255,255,0.08)') {
  ctx.save()
  ctx.fillStyle = fillStyle
  roundRect(ctx, x + 6, y + 6, CELL - 12, CELL - 12, 12)
  ctx.fill()
  ctx.strokeStyle = borderStyle
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

function drawBadge(ctx, x, y, text, color) {
  if (!text || text === '0') return
  const width = 12 + text.length * 8
  ctx.save()
  ctx.fillStyle = withAlpha(color, 0.18)
  roundRect(ctx, x, y, width, 18, 8)
  ctx.fill()
  ctx.strokeStyle = withAlpha(color, 0.65)
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = '11px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + width / 2, y + 9)
  ctx.restore()
}

function drawValueText(ctx, cx, cy, value, sub, color = '#f7f5ef') {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.font = '700 26px Inter, Arial, sans-serif'
  ctx.fillText(value, cx, cy - 6)
  if (sub) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '12px Inter, Arial, sans-serif'
    ctx.fillText(sub, cx, cy + 18)
  }
  ctx.restore()
}

function drawMiniBalanceBar(ctx, x, y, width, whiteValue, blackValue) {
  const total = Math.max(whiteValue + blackValue, 0.0001)
  const whiteRatio = whiteValue / total
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, x, y, width, 8, 4)
  ctx.fill()
  ctx.fillStyle = withAlpha(WHITE_COLOR, 0.85)
  roundRect(ctx, x, y, width * whiteRatio, 8, 4)
  ctx.fill()
  ctx.fillStyle = withAlpha(BLACK_COLOR, 0.85)
  roundRect(ctx, x + width * whiteRatio, y, width * (1 - whiteRatio), 8, 4)
  ctx.fill()
  ctx.restore()
}

function getSquareMetrics(data, file, rank) {
  const counts = data.counts
  return {
    activity: clamp(data.matrices.total[file][rank] * 0.7 + data.matrices.conflict[file][rank] * 0.2 + data.matrices.pressure[file][rank] * 0.25 + data.matrices.chaos[file][rank] * 0.15, 0, 1),
    white: data.matrices.white[file][rank],
    black: data.matrices.black[file][rank],
    conflict: clamp(data.matrices.conflict[file][rank] + data.matrices.chaos[file][rank] * 0.35, 0, 1),
    pressure: data.matrices.pressure[file][rank],
    chaos: data.matrices.chaos[file][rank],
    visits: counts.visits[file][rank],
    captures: counts.captures[file][rank],
    checks: counts.checks[file][rank],
    mates: counts.mates[file][rank],
    promotions: counts.promotions[file][rank],
    mistakes: counts.mistakes[file][rank],
    blunders: counts.blunders[file][rank],
    sacrifices: counts.sacrifices[file][rank],
  }
}

function drawActivityView(ctx, data) {
  drawBoardBase(ctx, 1)
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const m = getSquareMetrics(data, file, rank)
      const color = heatRampColor(m.activity)
      const gradient = ctx.createLinearGradient(x, y, x, y + CELL)
      gradient.addColorStop(0, withAlpha(mixColors(color, '#ffffff', 0.12), 0.95))
      gradient.addColorStop(1, withAlpha(mixColors(color, '#000000', 0.22), 0.95))
      drawCellShell(ctx, x, y, gradient, withAlpha(color, 0.45))

      drawValueText(ctx, cx, cy, `${Math.round(m.activity * 100)}`, `${m.visits} passages`, '#ffffff')
      drawMiniBalanceBar(ctx, x + 16, y + CELL - 24, CELL - 32, m.white, m.black)
      drawBadge(ctx, x + 12, y + 10, `V${m.visits}`, '#bfc7d5')
      if (m.captures) drawBadge(ctx, x + CELL - 54, y + 10, `x${m.captures}`, CONFLICT_COLOR)
      if (m.checks || m.mates) drawBadge(ctx, x + CELL - 54, y + 32, `${m.mates ? '#' : '+'}${m.mates || m.checks}`, PRESSURE_COLOR)
      if (m.blunders || m.mistakes) drawBadge(ctx, x + 12, y + 32, `!${m.blunders + m.mistakes}`, CHAOS_COLOR)
    }
  }
}

function drawCampsView(ctx, data) {
  drawBoardBase(ctx, 1)
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const m = getSquareMetrics(data, file, rank)
      drawCellShell(ctx, x, y, 'rgba(20,25,34,0.98)', 'rgba(255,255,255,0.08)')

      ctx.save()
      ctx.beginPath()
      roundRect(ctx, x + 6, y + 6, CELL - 12, CELL - 12, 12)
      ctx.clip()
      ctx.fillStyle = withAlpha(WHITE_COLOR, 0.18 + m.white * 0.55)
      ctx.fillRect(x + 6, y + 6, (CELL - 12) / 2, CELL - 12)
      ctx.fillStyle = withAlpha(BLACK_COLOR, 0.18 + m.black * 0.55)
      ctx.fillRect(x + CELL / 2, y + 6, (CELL - 12) / 2, CELL - 12)
      ctx.restore()

      const delta = Math.round((m.white - m.black) * 100)
      drawValueText(ctx, cx, cy, delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`, `${Math.round(m.white * 100)} / ${Math.round(m.black * 100)}`, '#ffffff')
      drawBadge(ctx, x + 12, y + 10, `B ${Math.round(m.white * 100)}`, WHITE_COLOR)
      drawBadge(ctx, x + CELL - 62, y + 10, `N ${Math.round(m.black * 100)}`, BLACK_COLOR)
      if (m.activity > 0.55) drawBadge(ctx, x + 12, y + CELL - 30, `${Math.round(m.activity * 100)}`, heatRampColor(m.activity))
    }
  }
}

function drawConflictsView(ctx, data) {
  drawBoardBase(ctx, 1)
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const m = getSquareMetrics(data, file, rank)
      const eventScore = clamp(m.conflict * 0.8 + m.chaos * 0.4 + m.sacrifices * 0.15, 0, 1)
      const color = conflictRamp(eventScore)
      const gradient = ctx.createLinearGradient(x, y, x + CELL, y + CELL)
      gradient.addColorStop(0, withAlpha(mixColors(color, '#ffffff', 0.1), 0.98))
      gradient.addColorStop(1, withAlpha(mixColors(color, '#000000', 0.2), 0.98))
      drawCellShell(ctx, x, y, gradient, withAlpha(color, 0.45))

      const count = m.captures + m.sacrifices + m.mistakes + m.blunders
      drawValueText(ctx, cx, cy, `${count}`, `${Math.round(eventScore * 100)} score`, '#fff7ee')
      if (m.captures) drawBadge(ctx, x + 12, y + 10, `x${m.captures}`, CONFLICT_COLOR)
      if (m.sacrifices) drawBadge(ctx, x + CELL - 54, y + 10, `s${m.sacrifices}`, '#86e2c6')
      if (m.mistakes || m.blunders) drawBadge(ctx, x + 12, y + 32, `!${m.mistakes + m.blunders}`, CHAOS_COLOR)
      if (m.checks) drawBadge(ctx, x + CELL - 54, y + 32, `+${m.checks}`, PRESSURE_COLOR)
    }
  }
}

function drawPressureView(ctx, data) {
  drawBoardBase(ctx, 1)
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const m = getSquareMetrics(data, file, rank)
      const color = pressureRamp(m.pressure)
      const gradient = ctx.createRadialGradient(cx, cy - 8, 6, cx, cy, CELL * 0.7)
      gradient.addColorStop(0, withAlpha(mixColors(color, '#ffffff', 0.12), 0.98))
      gradient.addColorStop(1, withAlpha(mixColors(color, '#000000', 0.24), 0.98))
      drawCellShell(ctx, x, y, gradient, withAlpha(color, 0.45))

      const pressureValue = Math.round(m.pressure * 100)
      const pressureLabel = m.mates ? `#${m.mates}` : m.checks ? `+${m.checks}` : `${pressureValue}`
      drawValueText(ctx, cx, cy, pressureLabel, `${pressureValue} pression`, '#ffffff')
      if (m.promotions) drawBadge(ctx, x + 12, y + 10, `^${m.promotions}`, PROMOTION_COLOR)
      if (m.checks) drawBadge(ctx, x + CELL - 54, y + 10, `+${m.checks}`, PRESSURE_COLOR)
      if (m.mates) drawBadge(ctx, x + CELL - 54, y + 32, `#${m.mates}`, '#fff6a7')
      if (m.activity > 0.45) drawMiniBalanceBar(ctx, x + 16, y + CELL - 24, CELL - 32, m.white, m.black)
    }
  }
}

function drawSmoothedView(ctx, data) {
  drawBoardBase(ctx, 0.22)
  const step = 8
  for (let py = MARGIN; py < MARGIN + BOARD_SIZE; py += step) {
    for (let px = MARGIN; px < MARGIN + BOARD_SIZE; px += step) {
      let value = 0
      for (let file = 0; file < 8; file += 1) {
        for (let rank = 0; rank < 8; rank += 1) {
          const { cx, cy } = cellRect(file, rank)
          const m = getSquareMetrics(data, file, rank)
          const dx = px - cx
          const dy = py - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          const gaussian = Math.exp(-(dist * dist) / (2 * (CELL * 0.72) ** 2))
          value += (m.activity * 0.55 + m.conflict * 0.18 + m.pressure * 0.27) * gaussian
        }
      }
      const intensity = clamp(value, 0, 1)
      ctx.fillStyle = withAlpha(viridisColor(intensity), 0.94)
      ctx.fillRect(px, py, step + 1, step + 1)
    }
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  for (let file = 0; file <= 8; file += 1) {
    const x = MARGIN + file * CELL
    ctx.beginPath(); ctx.moveTo(x, MARGIN); ctx.lineTo(x, MARGIN + BOARD_SIZE); ctx.stroke()
  }
  for (let rank = 0; rank <= 8; rank += 1) {
    const y = MARGIN + rank * CELL
    ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(MARGIN + BOARD_SIZE, y); ctx.stroke()
  }
  ctx.restore()

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { cx, cy } = cellRect(file, rank)
      const m = getSquareMetrics(data, file, rank)
      if (m.activity < 0.22) continue
      ctx.save()
      ctx.fillStyle = withAlpha('#081018', 0.6)
      roundRect(ctx, cx - 20, cy - 14, 40, 28, 10)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${Math.round(m.activity * 100)}`, cx, cy)
      ctx.restore()
    }
  }
}

function drawTitleAndLegend(ctx, analysis, description, mode) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.font = '700 40px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(description.title, MARGIN, 54)
  ctx.fillStyle = 'rgba(255,255,255,0.66)'
  ctx.font = '18px Inter, Arial, sans-serif'
  ctx.fillText(`${analysis.headers.White || 'Blancs'} vs ${analysis.headers.Black || 'Noirs'} · ${analysis.opening?.label || 'Ouverture libre'} · ${analysis.result}`, MARGIN, 82)

  const legendX = SIZE - MARGIN - 280
  const legendY = 42
  const legendWidth = 220
  const legendHeight = 16
  let colors = [heatRampColor(0), heatRampColor(0.35), heatRampColor(0.7), heatRampColor(1)]
  let title = 'Activité'
  let labels = ['faible', 'moyenne', 'forte']
  if (mode === 'camps') {
    colors = [WHITE_COLOR, mixColors(WHITE_COLOR, BLACK_COLOR, 0.5), BLACK_COLOR]
    title = 'Dominance'
    labels = ['Blancs', 'mixte', 'Noirs']
  } else if (mode === 'conflicts') {
    colors = [conflictRamp(0.1), conflictRamp(0.5), conflictRamp(1)]
    title = 'Conflits'
    labels = ['faibles', 'moyens', 'forts']
  } else if (mode === 'pressure') {
    colors = [pressureRamp(0.1), pressureRamp(0.6), pressureRamp(1)]
    title = 'Pression'
    labels = ['basse', 'moyenne', 'forte']
  } else if (mode === 'smoothed') {
    colors = [viridisColor(0), viridisColor(0.4), viridisColor(0.75), viridisColor(1)]
    title = 'Champ lissé'
    labels = ['faible', 'moyen', 'fort']
  }

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.84)'
  ctx.font = '16px Inter, Arial, sans-serif'
  ctx.fillText(title, legendX + legendWidth, legendY - 10)

  const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY)
  colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color))
  ctx.fillStyle = gradient
  roundRect(ctx, legendX, legendY, legendWidth, legendHeight, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = '12px Inter, Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.64)'
  ctx.textAlign = 'left'
  ctx.fillText(labels[0], legendX, legendY + 30)
  ctx.textAlign = 'center'
  if (labels[1]) ctx.fillText(labels[1], legendX + legendWidth / 2, legendY + 30)
  ctx.textAlign = 'right'
  ctx.fillText(labels.at(-1), legendX + legendWidth, legendY + 30)
  ctx.restore()
}

function drawFooter(ctx, description, heatmapData) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.56)'
  ctx.font = '16px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Hotspots : ${description.hotspots.join(' · ')}`, MARGIN, SIZE - 42)
  ctx.textAlign = 'right'
  ctx.fillText(`Centre : ${heatmapData.centerShare} % · Domination : ${heatmapData.dominantSide}`, SIZE - MARGIN, SIZE - 42)
  ctx.restore()
}

export function renderPainting(canvas, analysis, sourcePgn, options = {}) {
  const mode = options.mode || 'activity'
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, SIZE, SIZE)

  const heatmapData = buildHeatmapData(analysis)
  const description = describeHeatmap(analysis, heatmapData, mode)
  const random = randomGenerator(hashText(`${sourcePgn}|${mode}|v1.2`))

  drawBackground(ctx, random)
  if (mode === 'camps') drawCampsView(ctx, heatmapData)
  else if (mode === 'conflicts') drawConflictsView(ctx, heatmapData)
  else if (mode === 'pressure') drawPressureView(ctx, heatmapData)
  else if (mode === 'smoothed') drawSmoothedView(ctx, heatmapData)
  else drawActivityView(ctx, heatmapData)

  drawTitleAndLegend(ctx, analysis, description, mode)
  drawFooter(ctx, description, heatmapData)

  return { heatmapData, description }
}

export function downloadPainting(canvas, filename = 'chess-paint.png') {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
