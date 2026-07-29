const SIZE = 1400
const MARGIN = 110
const BOARD_SIZE = SIZE - MARGIN * 2
const CELL = BOARD_SIZE / 8

const WHITE_COLOR = '#f2b661'
const BLACK_COLOR = '#5f86d6'
const CONFLICT_COLOR = '#e96f5b'
const PRESSURE_COLOR = '#f4e39d'
const BOARD_DARK = '#1a1d27'
const BOARD_LIGHT = '#242a38'
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


function interpolateChannel(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function interpolateColors(hexA, hexB, t) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return `rgb(${interpolateChannel(a.r, b.r, t)}, ${interpolateChannel(a.g, b.g, t)}, ${interpolateChannel(a.b, b.b, t)})`
}

function heatRampColor(intensity) {
  const value = clamp(intensity, 0, 1)
  const stops = [
    { stop: 0, color: '#2dbb68' },
    { stop: 0.33, color: '#d9d34a' },
    { stop: 0.66, color: '#ef8d32' },
    { stop: 1, color: '#d63a2f' },
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
  const flat = matrix.flat()
  const max = Math.max(...flat, 0.0001)
  return matrix.map((row) => row.map((value) => value / max))
}

function sumMatrix(matrix) {
  return matrix.flat().reduce((sum, value) => sum + value, 0)
}

function combinedIntensity(matrices, file, rank) {
  const { total, white, black, conflict, pressure, chaos } = matrices
  return total[file][rank] + white[file][rank] + black[file][rank] + conflict[file][rank] * 1.3 + pressure[file][rank] * 1.6 + chaos[file][rank] * 1.1
}

export function buildHeatmapData(analysis) {
  const total = createMatrix(0)
  const white = createMatrix(0)
  const black = createMatrix(0)
  const conflict = createMatrix(0)
  const pressure = createMatrix(0)
  const chaos = createMatrix(0)
  const visitCount = createMatrix(0)
  const eventSquares = []

  for (const row of analysis.rows) {
    const from = squareToCoords(row.from)
    const to = squareToCoords(row.to)
    const sideMatrix = row.color === 'w' ? white : black
    const q = qualityWeight(row)

    total[from.file][from.rank] += 0.35 * q
    total[to.file][to.rank] += 1.2 * q
    sideMatrix[from.file][from.rank] += 0.25 * q
    sideMatrix[to.file][to.rank] += 1.35 * q
    visitCount[to.file][to.rank] += 1

    if (row.captured) {
      conflict[to.file][to.rank] += 2.8 + q * 0.8
      total[to.file][to.rank] += 1.6
      eventSquares.push({ type: 'capture', square: row.to, strength: 1.8 + q * 0.35 })
    }
    if (row.motifs.includes('échec')) {
      pressure[to.file][to.rank] += 3.8 + q * 0.9
      eventSquares.push({ type: 'check', square: row.to, strength: 2.6 + q * 0.45 })
    }
    if (row.motifs.includes('mat')) {
      pressure[to.file][to.rank] += 7.5 + q
      conflict[to.file][to.rank] += 1.5
      eventSquares.push({ type: 'mate', square: row.to, strength: 4.5 })
    }
    if (row.motifs.includes('promotion')) {
      pressure[to.file][to.rank] += 2.6
      total[to.file][to.rank] += 1.4
      eventSquares.push({ type: 'promotion', square: row.to, strength: 2.2 })
    }
    if (row.quality === 'mistake' || row.quality === 'blunder') {
      chaos[to.file][to.rank] += row.quality === 'blunder' ? 3.2 : 1.9
      eventSquares.push({ type: row.quality, square: row.to, strength: row.quality === 'blunder' ? 2.4 : 1.4 })
    }
    if (row.sacrifice) {
      conflict[to.file][to.rank] += 2.1
      pressure[to.file][to.rank] += 1.2
      eventSquares.push({ type: 'sacrifice', square: row.to, strength: 2.5 })
    }
  }

  const normalized = {
    total: normalizeMatrix(total),
    white: normalizeMatrix(white),
    black: normalizeMatrix(black),
    conflict: normalizeMatrix(conflict),
    pressure: normalizeMatrix(pressure),
    chaos: normalizeMatrix(chaos),
    visits: visitCount,
  }

  const hotspots = []
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      hotspots.push({
        square: squareName(file, rank),
        intensity: combinedIntensity(normalized, file, rank),
        total: normalized.total[file][rank],
        white: normalized.white[file][rank],
        black: normalized.black[file][rank],
        conflict: normalized.conflict[file][rank],
        pressure: normalized.pressure[file][rank],
        chaos: normalized.chaos[file][rank],
        visits: visitCount[file][rank],
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
    : whitePressure > blackPressure
      ? 'Blancs'
      : 'Noirs'

  return {
    matrices: normalized,
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
    .sort((a, b) => (b.conflict + b.pressure) - (a.conflict + a.pressure))
    .slice(0, 2)
    .map((entry) => entry.square)
  const modeLabels = {
    classic2d: 'Heat map 2D',
    painterly2d: 'Heat map fluide',
    relief3d: 'Heat map relief',
  }
  const title = `Carte thermique — ${modeLabels[mode] || 'Heat map'}`
  const commentary = [
    `Les cases les plus actives sont ${top.join(', ')}.`,
    `Le centre représente environ ${heatmapData.centerShare} % de l’énergie spatiale de la partie.`,
    `La domination territoriale penche vers : ${heatmapData.dominantSide}.`,
    topConflict.length ? `Les tensions les plus fortes se concentrent autour de ${topConflict.join(' et ')}.` : '',
  ].filter(Boolean).join(' ')

  return {
    title,
    commentary,
    modeLabel: modeLabels[mode] || 'Heat map',
    dominantSide: heatmapData.dominantSide,
    hotspots: top,
  }
}

function drawBackground(ctx, random) {
  const gradient = ctx.createLinearGradient(0, 0, 0, SIZE)
  gradient.addColorStop(0, '#12141b')
  gradient.addColorStop(1, '#0a0c11')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  for (let i = 0; i < 1800; i += 1) {
    const alpha = 0.008 + random() * 0.012
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(random() * SIZE, random() * SIZE, 1 + random() * 2.2, 1 + random() * 2.2)
  }
  ctx.restore()
}

function drawBoardBase(ctx, opacity = 1) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#11141b'
  roundRect(ctx, MARGIN - 18, MARGIN - 18, BOARD_SIZE + 36, BOARD_SIZE + 36, 24)
  ctx.fill()

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y } = cellRect(file, rank)
      ctx.fillStyle = (file + rank) % 2 === 0 ? BOARD_LIGHT : BOARD_DARK
      ctx.fillRect(x, y, CELL, CELL)
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let file = 0; file <= 8; file += 1) {
    const x = MARGIN + file * CELL
    ctx.beginPath()
    ctx.moveTo(x, MARGIN)
    ctx.lineTo(x, MARGIN + BOARD_SIZE)
    ctx.stroke()
  }
  for (let rank = 0; rank <= 8; rank += 1) {
    const y = MARGIN + rank * CELL
    ctx.beginPath()
    ctx.moveTo(MARGIN, y)
    ctx.lineTo(MARGIN + BOARD_SIZE, y)
    ctx.stroke()
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

function drawClassic2D(ctx, data) {
  drawBoardBase(ctx, 1)

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const total = data.matrices.total[file][rank]
      const conflict = data.matrices.conflict[file][rank]
      const pressure = data.matrices.pressure[file][rank]
      const chaos = data.matrices.chaos[file][rank]
      const intensity = clamp(total * 0.62 + conflict * 0.26 + pressure * 0.34 + chaos * 0.18, 0, 1)
      if (intensity < 0.01) continue

      const color = heatRampColor(intensity)
      ctx.fillStyle = withAlpha(color, 0.18 + intensity * 0.38)
      ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6)

      const glow = ctx.createRadialGradient(cx, cy, 3, cx, cy, CELL * 0.64)
      glow.addColorStop(0, withAlpha(color, 0.16 + intensity * 0.34))
      glow.addColorStop(0.55, withAlpha(color, 0.08 + intensity * 0.12))
      glow.addColorStop(1, withAlpha(color, 0))
      ctx.fillStyle = glow
      ctx.fillRect(x, y, CELL, CELL)

      if (pressure > 0.45 || conflict > 0.35) {
        ctx.strokeStyle = withAlpha(pressure > conflict ? PRESSURE_COLOR : CONFLICT_COLOR, 0.28 + intensity * 0.32)
        ctx.lineWidth = 2
        ctx.strokeRect(x + 7, y + 7, CELL - 14, CELL - 14)
      }
    }
  }

  drawEventMarkers(ctx, data, false)
}

function drawSoftBlob(ctx, x, y, radius, color, alpha = 0.2) {
  const gradient = ctx.createRadialGradient(x, y, 4, x, y, radius)
  gradient.addColorStop(0, withAlpha(color, alpha))
  gradient.addColorStop(0.62, withAlpha(color, alpha * 0.55))
  gradient.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

function drawBrushStroke(ctx, x, y, width, height, angle, color, alpha = 0.2) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const gradient = ctx.createLinearGradient(-width / 2, 0, width / 2, 0)
  gradient.addColorStop(0, withAlpha(color, 0))
  gradient.addColorStop(0.18, withAlpha(color, alpha * 0.85))
  gradient.addColorStop(0.5, withAlpha(color, alpha))
  gradient.addColorStop(0.82, withAlpha(color, alpha * 0.75))
  gradient.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = gradient
  roundRect(ctx, -width / 2, -height / 2, width, height, Math.min(height, width) * 0.28)
  ctx.fill()
  ctx.restore()
}

function drawPainterly2D(ctx, data) {
  drawBoardBase(ctx, 0.3)

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y, cx, cy } = cellRect(file, rank)
      const total = data.matrices.total[file][rank]
      const white = data.matrices.white[file][rank]
      const black = data.matrices.black[file][rank]
      const conflict = data.matrices.conflict[file][rank]
      const pressure = data.matrices.pressure[file][rank]
      const chaos = data.matrices.chaos[file][rank]
      const intensity = clamp(total * 0.72 + conflict * 0.32 + pressure * 0.42 + chaos * 0.22, 0, 1)
      if (intensity < 0.02) continue

      const mainColor = white >= black ? WHITE_COLOR : BLACK_COLOR
      const accent = pressure > 0.46 ? PRESSURE_COLOR : conflict > 0.32 ? CONFLICT_COLOR : heatRampColor(intensity)
      const angleBase = (file - rank) * 0.12

      ctx.fillStyle = withAlpha(heatRampColor(intensity), 0.06 + intensity * 0.08)
      ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
      drawSoftBlob(ctx, cx, cy, CELL * (0.34 + intensity * 0.24), mainColor, 0.08 + intensity * 0.08)
      drawBrushStroke(ctx, cx, cy, CELL * (0.62 + intensity * 0.18), CELL * (0.13 + intensity * 0.04), angleBase, mainColor, 0.16 + intensity * 0.13)
      drawBrushStroke(ctx, cx + (white - black) * 10, cy - (white - black) * 8, CELL * (0.44 + intensity * 0.12), CELL * 0.1, angleBase + 0.9, accent, 0.12 + intensity * 0.09)
      if (intensity > 0.5) {
        drawBrushStroke(ctx, cx - 6, cy + 6, CELL * 0.34, CELL * 0.08, angleBase - 0.72, mixColors(mainColor, '#ffffff', 0.18), 0.1 + intensity * 0.06)
      }
    }
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
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

  drawEventMarkers(ctx, data, true)
}

function drawRelief3D(ctx, data) {
  drawBoardBase(ctx, 0.82)

  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const { x, y } = cellRect(file, rank)
      const total = data.matrices.total[file][rank]
      const conflict = data.matrices.conflict[file][rank]
      const pressure = data.matrices.pressure[file][rank]
      const chaos = data.matrices.chaos[file][rank]
      const intensity = clamp(total * 0.7 + conflict * 0.28 + pressure * 0.4 + chaos * 0.16, 0, 1)
      const inset = 12
      const width = CELL - inset * 2
      const height = CELL - inset * 2
      const lift = 4 + intensity * 34
      const color = heatRampColor(intensity)

      ctx.fillStyle = 'rgba(0,0,0,0.24)'
      roundRect(ctx, x + inset + 6, y + inset + 10, width, height, 14)
      ctx.fill()

      const sideGradient = ctx.createLinearGradient(x + inset, y, x + inset, y + CELL)
      sideGradient.addColorStop(0, withAlpha(mixColors(color, '#000000', 0.35), 0.95))
      sideGradient.addColorStop(1, withAlpha(mixColors(color, '#000000', 0.58), 0.95))
      ctx.fillStyle = sideGradient
      roundRect(ctx, x + inset, y + inset + lift * 0.45, width, height, 14)
      ctx.fill()

      const topGradient = ctx.createLinearGradient(x, y + inset, x, y + inset + height)
      topGradient.addColorStop(0, mixColors(color, '#ffffff', 0.2))
      topGradient.addColorStop(1, mixColors(color, '#000000', 0.1))
      ctx.fillStyle = topGradient
      roundRect(ctx, x + inset, y + inset - lift, width, height, 14)
      ctx.fill()

      if (pressure > 0.45 || conflict > 0.35) {
        ctx.strokeStyle = withAlpha(pressure > conflict ? PRESSURE_COLOR : CONFLICT_COLOR, 0.4 + intensity * 0.28)
        ctx.lineWidth = 2
        roundRect(ctx, x + inset + 6, y + inset - lift + 6, width - 12, height - 12, 10)
        ctx.stroke()
      }
    }
  }

  drawEventMarkers(ctx, data, false)
}

function drawEventMarkers(ctx, data, subtle) {
  const drawn = new Map()
  for (const event of data.eventSquares) {
    const { file, rank } = squareToCoords(event.square)
    const { cx, cy } = cellRect(file, rank)
    const key = `${event.type}-${event.square}`
    const count = drawn.get(key) || 0
    drawn.set(key, count + 1)
    const dx = (count % 3 - 1) * 13
    const dy = Math.floor(count / 3) * 13 - 5
    const x = cx + dx
    const y = cy + dy

    ctx.save()
    ctx.lineWidth = subtle ? 1.8 : 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    switch (event.type) {
      case 'capture':
        ctx.strokeStyle = withAlpha(CONFLICT_COLOR, subtle ? 0.75 : 0.95)
        ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke()
        break
      case 'check':
        ctx.strokeStyle = withAlpha(PRESSURE_COLOR, subtle ? 0.78 : 0.96)
        ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 4, y - 1); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x + 2, y + 11); ctx.lineTo(x - 5, y + 2); ctx.lineTo(x, y + 2); ctx.stroke()
        break
      case 'mate':
        ctx.strokeStyle = withAlpha(PRESSURE_COLOR, 0.98)
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke()
        break
      case 'promotion':
        ctx.strokeStyle = withAlpha('#8de2d6', subtle ? 0.75 : 0.9)
        ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y - 10); ctx.moveTo(x, y - 10); ctx.lineTo(x - 6, y - 2); ctx.moveTo(x, y - 10); ctx.lineTo(x + 6, y - 2); ctx.stroke()
        break
      case 'blunder':
      case 'mistake':
        ctx.strokeStyle = withAlpha('#cf8cff', subtle ? 0.68 : 0.86)
        ctx.beginPath(); ctx.moveTo(x - 8, y + 8); ctx.lineTo(x - 2, y); ctx.lineTo(x + 1, y + 2); ctx.lineTo(x + 8, y - 8); ctx.stroke()
        break
      case 'sacrifice':
        ctx.strokeStyle = withAlpha('#7ae0c4', subtle ? 0.7 : 0.88)
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke()
        break
      default:
        break
    }
    ctx.restore()
  }
}

function drawLegendAndTitle(ctx, analysis, description, mode) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '600 40px Inter, Arial, sans-serif'
  ctx.fillText(description.title, MARGIN, 54)

  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = '18px Inter, Arial, sans-serif'
  ctx.fillText(`${analysis.headers.White || 'Blancs'} vs ${analysis.headers.Black || 'Noirs'} · ${analysis.opening?.label || 'Ouverture libre'} · ${analysis.result}`, MARGIN, 82)

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '16px Inter, Arial, sans-serif'
  ctx.fillText(mode === 'classic2d' || mode === 'relief3d' ? 'Activité' : 'Lecture', SIZE - MARGIN, 40)

  const items = mode === 'classic2d' || mode === 'relief3d'
    ? [
      { label: 'Faible', color: '#2dbb68' },
      { label: 'Moyen', color: '#d9d34a' },
      { label: 'Fort', color: '#ef8d32' },
      { label: 'Très fort', color: '#d63a2f' },
    ]
    : [
      { label: 'Blancs', color: WHITE_COLOR },
      { label: 'Noirs', color: BLACK_COLOR },
      { label: 'Prises', color: CONFLICT_COLOR },
      { label: 'Échecs / mat', color: PRESSURE_COLOR },
    ]
  items.forEach((item, index) => {
    const x = SIZE - MARGIN - 260 + index * 64
    const y = 74
    ctx.fillStyle = item.color
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '12px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(item.label, x + 14, y + 4)
  })
  ctx.restore()
}

function drawFooter(ctx, description, heatmapData) {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.54)'
  ctx.font = '16px Inter, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Points chauds : ${description.hotspots.join(' · ')}`, MARGIN, SIZE - 42)
  ctx.textAlign = 'right'
  ctx.fillText(`Centre : ${heatmapData.centerShare} % · Domination : ${heatmapData.dominantSide}`, SIZE - MARGIN, SIZE - 42)
  ctx.restore()
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

export function renderPainting(canvas, analysis, sourcePgn, options = {}) {
  const mode = options.mode || 'painterly2d'
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, SIZE, SIZE)

  const heatmapData = buildHeatmapData(analysis)
  const description = describeHeatmap(analysis, heatmapData, mode)
  const random = randomGenerator(hashText(`${sourcePgn}|${mode}|heatmap`))

  drawBackground(ctx, random)

  if (mode === 'classic2d') drawClassic2D(ctx, heatmapData)
  else if (mode === 'relief3d') drawRelief3D(ctx, heatmapData)
  else drawPainterly2D(ctx, heatmapData)

  drawLegendAndTitle(ctx, analysis, description, mode)
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
