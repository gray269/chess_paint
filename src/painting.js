const SIZE = 1600
const MARGIN = 118
const BOARD_SIZE = SIZE - MARGIN * 2
const CELL = BOARD_SIZE / 8

export const PALETTES = {
  automatic: { label: 'Automatique' },
  forest: {
    label: 'Forêt humide', background: '#101b18', low: '#284f43', medium: '#7f9d58', high: '#d2a653', critical: '#d6684f', white: '#e9c875', black: '#4e9b8f', ink: '#f2ecda', shadow: '#07110f',
  },
  ocean: {
    label: 'Océan nocturne', background: '#07182b', low: '#123c58', medium: '#168b9a', high: '#ef8d70', critical: '#f8eac0', white: '#eab86b', black: '#5f91d8', ink: '#eff7f3', shadow: '#030c16',
  },
  ember: {
    label: 'Braise', background: '#1d1110', low: '#5a3024', medium: '#b25b32', high: '#e98a3a', critical: '#ffdc80', white: '#f3b668', black: '#b75a50', ink: '#fff0d8', shadow: '#0d0707',
  },
  storm: {
    label: 'Orage violet', background: '#171326', low: '#332754', medium: '#6f4ea1', high: '#d45e86', critical: '#f2d36f', white: '#eda96b', black: '#6f82dc', ink: '#f4efff', shadow: '#0b0913',
  },
  mineral: {
    label: 'Minéral', background: '#161b1d', low: '#324442', medium: '#77908a', high: '#b77658', critical: '#e9ddbf', white: '#d8bd84', black: '#6d8e91', ink: '#f0e9dc', shadow: '#0b0e0f',
  },
  dawn: {
    label: 'Aube froide', background: '#202838', low: '#4e5d78', medium: '#9a87aa', high: '#e49b86', critical: '#f9e7c8', white: '#f1ba82', black: '#768ac1', ink: '#fff8ef', shadow: '#101520',
  },
  ink: {
    label: 'Encre et or', background: '#0e1118', low: '#282e3a', medium: '#725e3d', high: '#c59a4a', critical: '#f5e4bb', white: '#d7aa55', black: '#65778f', ink: '#fff3d5', shadow: '#05070b',
  },
}

const MODE_LABELS = {
  painting: 'Œuvre pure',
  caption: 'Œuvre avec cartel',
  structure: 'Structure révélée',
}

export const PAINT_STYLES = {
  automatic: { label: 'Automatique' },
  oil: { label: 'Huile expressive', bristles: 13, opacity: 0.94, width: 1.34, backgroundAlpha: 1 },
  watercolor: { label: 'Aquarelle organique', bristles: 7, opacity: 0.34, width: 1.72, backgroundAlpha: 0.82 },
  inkwash: { label: 'Encre gestuelle', bristles: 5, opacity: 0.72, width: 0.92, backgroundAlpha: 0.72 },
  pastel: { label: 'Pastel poudreux', bristles: 9, opacity: 0.58, width: 1.46, backgroundAlpha: 0.92 },
  fresco: { label: 'Fresque ancienne', bristles: 8, opacity: 0.62, width: 1.2, backgroundAlpha: 0.86 },
}

const QUALITY_TEXTURE = {
  brilliant: { width: 1.28, alpha: 0.98, jitter: 0.05 },
  best: { width: 1.16, alpha: 0.92, jitter: 0.07 },
  excellent: { width: 1.06, alpha: 0.86, jitter: 0.08 },
  good: { width: 0.94, alpha: 0.72, jitter: 0.11 },
  inaccuracy: { width: 0.86, alpha: 0.54, jitter: 0.22 },
  mistake: { width: 1.03, alpha: 0.5, jitter: 0.35 },
  blunder: { width: 1.15, alpha: 0.58, jitter: 0.48 },
}

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

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function createMatrix(fill = 0) {
  return Array.from({ length: 8 }, () => Array(8).fill(fill))
}

function addToMatrix(matrix, file, rank, amount) {
  if (file >= 0 && file < 8 && rank >= 0 && rank < 8) matrix[file][rank] += amount
}

function normalizeMatrix(matrix) {
  const max = Math.max(...matrix.flat(), 1)
  return matrix.map((column) => column.map((value) => value / max))
}

function sumMatrix(matrix) {
  return matrix.flat().reduce((sum, value) => sum + value, 0)
}

function squareToCoords(square) {
  return { file: square.charCodeAt(0) - 97, rank: Number(square[1]) - 1 }
}

function squareName(file, rank) {
  return `${String.fromCharCode(97 + file)}${rank + 1}`
}

function squareCenter(square) {
  const { file, rank } = squareToCoords(square)
  return {
    x: MARGIN + (file + 0.5) * CELL,
    y: MARGIN + (7 - rank + 0.5) * CELL,
  }
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((item) => item + item).join('') : normalized, 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha)})`
}

function mixColors(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const w = clamp(weight)
  const channel = (key) => Math.round(a[key] * (1 - w) + b[key] * w).toString(16).padStart(2, '0')
  return `#${channel('r')}${channel('g')}${channel('b')}`
}

function choose(array, random) {
  return array[Math.floor(random() * array.length)]
}

function choosePalette(analysis, requested, seed) {
  if (requested && requested !== 'automatic' && PALETTES[requested]) return { id: requested, ...PALETTES[requested] }
  const tactical = ['king-storm', 'sacrifice', 'chaos', 'counterstroke', 'center-clash'].includes(analysis.theme?.id)
  const choices = tactical ? ['storm', 'ember', 'ocean', 'ink'] : ['forest', 'mineral', 'dawn', 'ocean', 'ink']
  const id = choices[seed % choices.length]
  return { id, ...PALETTES[id] }
}

function qualityWeight(row) {
  return ({ brilliant: 1.45, best: 1.27, excellent: 1.15, good: 1, inaccuracy: 0.82, mistake: 1.08, blunder: 1.2 })[row.quality] || 1
}

export function buildHeatmapData(analysis) {
  const total = createMatrix()
  const white = createMatrix()
  const black = createMatrix()
  const conflict = createMatrix()
  const pressure = createMatrix()
  const chaos = createMatrix()
  const visits = createMatrix()
  const captures = createMatrix()
  const checks = createMatrix()
  const mates = createMatrix()

  for (const row of analysis.rows) {
    const from = squareToCoords(row.from)
    const to = squareToCoords(row.to)
    const side = row.color === 'w' ? white : black
    const weight = qualityWeight(row)
    addToMatrix(total, from.file, from.rank, 0.3 * weight)
    addToMatrix(total, to.file, to.rank, 1.25 * weight)
    addToMatrix(side, from.file, from.rank, 0.22 * weight)
    addToMatrix(side, to.file, to.rank, 1.3 * weight)
    addToMatrix(visits, to.file, to.rank, 1)
    if (row.captured) {
      addToMatrix(conflict, to.file, to.rank, 3 + weight)
      addToMatrix(captures, to.file, to.rank, 1)
    }
    if (row.motifs.includes('échec') || row.motifs.includes('mat')) {
      addToMatrix(pressure, to.file, to.rank, row.motifs.includes('mat') ? 8 : 4)
      addToMatrix(checks, to.file, to.rank, 1)
    }
    if (row.motifs.includes('mat')) addToMatrix(mates, to.file, to.rank, 1)
    if (row.quality === 'mistake' || row.quality === 'blunder') {
      addToMatrix(chaos, to.file, to.rank, row.quality === 'blunder' ? 3.4 : 2)
    }
  }

  const matrices = {
    total: normalizeMatrix(total), white: normalizeMatrix(white), black: normalizeMatrix(black),
    conflict: normalizeMatrix(conflict), pressure: normalizeMatrix(pressure), chaos: normalizeMatrix(chaos),
  }
  const hotspots = []
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const intensity = matrices.total[file][rank]
        + matrices.conflict[file][rank] * 1.2
        + matrices.pressure[file][rank] * 1.45
        + matrices.chaos[file][rank] * 0.8
      hotspots.push({
        square: squareName(file, rank), intensity,
        activity: matrices.total[file][rank], white: matrices.white[file][rank], black: matrices.black[file][rank],
        conflict: matrices.conflict[file][rank], pressure: matrices.pressure[file][rank], chaos: matrices.chaos[file][rank],
        visits: visits[file][rank], captureCount: captures[file][rank], checkCount: checks[file][rank], mateCount: mates[file][rank],
      })
    }
  }
  hotspots.sort((a, b) => b.intensity - a.intensity)
  const centerSquares = new Set(['c4', 'd4', 'e4', 'f4', 'c5', 'd5', 'e5', 'f5'])
  const totalEnergy = hotspots.reduce((sum, item) => sum + item.intensity, 0) || 1
  const centerShare = Math.round(100 * hotspots.filter((item) => centerSquares.has(item.square)).reduce((sum, item) => sum + item.intensity, 0) / totalEnergy)
  const whitePressure = sumMatrix(white)
  const blackPressure = sumMatrix(black)
  const dominantSide = Math.abs(whitePressure - blackPressure) < 0.12 * (whitePressure + blackPressure)
    ? 'Équilibre' : whitePressure > blackPressure ? 'Blancs' : 'Noirs'
  return { matrices, counts: { visits, captures, checks, mates }, hotspots, centerShare, dominantSide, whitePressure, blackPressure }
}

export function describeHeatmap(analysis, heatmapData, mode = 'painting') {
  const hotspots = heatmapData.hotspots.slice(0, 3).map((entry) => entry.square)
  return {
    title: analysis.artworkTitle || 'Empreinte de la partie',
    commentary: `Les zones ${hotspots.join(', ')} structurent la matière. Le centre rassemble ${heatmapData.centerShare} % de l’énergie et la composition reste dominée par ${heatmapData.dominantSide.toLowerCase()}.`,
    modeLabel: MODE_LABELS[mode] || MODE_LABELS.painting,
    dominantSide: heatmapData.dominantSide,
    hotspots,
  }
}

function fillCanvas(ctx, palette, random, paintStyle) {
  const style = PAINT_STYLES[paintStyle] || PAINT_STYLES.oil
  const gradient = ctx.createRadialGradient(SIZE * 0.44, SIZE * 0.38, SIZE * 0.06, SIZE * 0.5, SIZE * 0.5, SIZE * 0.78)
  gradient.addColorStop(0, mixColors(palette.background, palette.low, paintStyle === 'watercolor' ? 0.52 : 0.35))
  gradient.addColorStop(0.62, palette.background)
  gradient.addColorStop(1, palette.shadow)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  const grainCount = paintStyle === 'fresco' ? 6200 : paintStyle === 'watercolor' ? 2600 : 4200
  for (let index = 0; index < grainCount; index += 1) {
    const alpha = (0.006 + random() * 0.028) * style.backgroundAlpha
    ctx.fillStyle = random() > 0.52 ? rgba(palette.ink, alpha) : rgba(palette.shadow, alpha * 1.6)
    const x = random() * SIZE
    const y = random() * SIZE
    const length = paintStyle === 'oil' ? 2 + random() * 16 : 1 + random() * 8
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((random() - 0.5) * 0.45)
    ctx.fillRect(0, 0, length, 0.55 + random() * (paintStyle === 'pastel' ? 2.2 : 1.1))
    ctx.restore()
  }
  ctx.restore()
}

function drawUniverseAtmosphere(ctx, heatmap, palette, theme, random) {
  const anchors = heatmap.hotspots.slice(0, 7).map((item) => ({ ...squareCenter(item.square), power: clamp(item.intensity / 2.4) }))
  ctx.save()
  ctx.lineCap = 'round'
  if (theme === 'oceanic') {
    for (let band = 0; band < 18; band += 1) {
      const y = MARGIN * 0.5 + random() * (SIZE - MARGIN)
      ctx.strokeStyle = rgba(band % 4 === 0 ? palette.high : palette.medium, 0.025 + random() * 0.065)
      ctx.lineWidth = 3 + random() * 18
      ctx.beginPath()
      ctx.moveTo(-80, y)
      for (let x = 0; x <= SIZE + 120; x += 120) ctx.quadraticCurveTo(x + 55, y + (random() - 0.5) * 75, x + 120, y + (random() - 0.5) * 30)
      ctx.stroke()
    }
  } else if (theme === 'botanical') {
    for (const anchor of anchors) {
      const length = CELL * (0.8 + anchor.power * 1.8)
      const angle = random() * Math.PI * 2
      ctx.strokeStyle = rgba(mixColors(palette.low, palette.ink, 0.16), 0.11 + anchor.power * 0.12)
      ctx.lineWidth = 5 + anchor.power * 15
      ctx.beginPath()
      ctx.moveTo(anchor.x, anchor.y)
      ctx.quadraticCurveTo(anchor.x + Math.cos(angle + 0.6) * length * 0.5, anchor.y + Math.sin(angle + 0.6) * length * 0.5, anchor.x + Math.cos(angle) * length, anchor.y + Math.sin(angle) * length)
      ctx.stroke()
    }
  } else if (theme === 'tempest') {
    for (const anchor of anchors.slice(0, 5)) {
      for (let ring = 0; ring < 4; ring += 1) {
        ctx.strokeStyle = rgba(ring % 2 ? palette.medium : palette.high, 0.035 + anchor.power * 0.07)
        ctx.lineWidth = 8 + ring * 7
        ctx.beginPath()
        ctx.arc(anchor.x, anchor.y, CELL * (0.35 + ring * 0.38), random() * Math.PI, random() * Math.PI + Math.PI * 1.3)
        ctx.stroke()
      }
    }
  } else if (theme === 'cartography') {
    ctx.setLineDash([4, 16])
    for (let index = 1; index < anchors.length; index += 1) {
      ctx.strokeStyle = rgba(palette.ink, 0.09)
      ctx.lineWidth = 2 + random() * 3
      ctx.beginPath()
      ctx.moveTo(anchors[index - 1].x, anchors[index - 1].y)
      ctx.quadraticCurveTo(SIZE * random(), SIZE * random(), anchors[index].x, anchors[index].y)
      ctx.stroke()
    }
    ctx.setLineDash([])
  } else if (theme === 'celestial') {
    for (let index = 0; index < 240; index += 1) {
      const radius = random() > 0.92 ? 2.5 + random() * 4 : 0.7 + random() * 1.8
      ctx.fillStyle = rgba(random() > 0.8 ? palette.critical : palette.ink, 0.08 + random() * 0.26)
      ctx.beginPath()
      ctx.arc(random() * SIZE, random() * SIZE, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function organicPath(ctx, cx, cy, radiusX, radiusY, random, vertices = 12) {
  ctx.beginPath()
  for (let index = 0; index <= vertices; index += 1) {
    const angle = (index / vertices) * Math.PI * 2
    const wobble = 0.83 + random() * 0.3
    const x = cx + Math.cos(angle) * radiusX * wobble
    const y = cy + Math.sin(angle) * radiusY * wobble
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function geometryPath(ctx, family, cx, cy, radius, random) {
  if (family === 'circles') {
    ctx.beginPath()
    ctx.ellipse(cx, cy, radius * (0.82 + random() * 0.3), radius * (0.82 + random() * 0.3), random() * Math.PI, 0, Math.PI * 2)
  } else if (family === 'triangles') {
    const rotation = random() * Math.PI * 2
    ctx.beginPath()
    for (let index = 0; index < 3; index += 1) {
      const angle = rotation + index * Math.PI * 2 / 3
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
  } else if (family === 'diamonds') {
    ctx.beginPath()
    ctx.moveTo(cx, cy - radius)
    ctx.quadraticCurveTo(cx + radius * 0.16, cy - radius * 0.16, cx + radius, cy)
    ctx.quadraticCurveTo(cx + radius * 0.16, cy + radius * 0.16, cx, cy + radius)
    ctx.quadraticCurveTo(cx - radius * 0.16, cy + radius * 0.16, cx - radius, cy)
    ctx.quadraticCurveTo(cx - radius * 0.16, cy - radius * 0.16, cx, cy - radius)
  } else {
    organicPath(ctx, cx, cy, radius * (0.88 + random() * 0.2), radius * (0.75 + random() * 0.35), random)
  }
}

function backgroundColor(entry, palette) {
  if (entry.mateCount) return palette.critical
  if (entry.pressure > 0.55 || entry.conflict > 0.7) return mixColors(palette.high, palette.critical, 0.42)
  if (entry.activity > 0.62) return palette.high
  if (entry.activity > 0.28) return palette.medium
  return palette.low
}

function drawHeatShapes(ctx, heatmap, palette, family, random, density, paintStyle) {
  const densityFactor = density === 'airy' ? 0.82 : density === 'dense' ? 1.16 : 1
  const style = PAINT_STYLES[paintStyle] || PAINT_STYLES.oil
  const ordered = [...heatmap.hotspots].sort((a, b) => a.activity - b.activity)
  ctx.save()
  for (const entry of ordered) {
    const center = squareCenter(entry.square)
    const intensity = clamp(entry.intensity / 2.4)
    const layers = intensity > 0.72 ? 3 : intensity > 0.35 ? 2 : 1
    for (let layer = 0; layer < layers; layer += 1) {
      const radius = CELL * densityFactor * (0.2 + intensity * 0.36) * (1 - layer * 0.13)
      const jitter = CELL * (0.02 + layer * 0.025)
      const x = center.x + (random() - 0.5) * jitter
      const y = center.y + (random() - 0.5) * jitter
      const color = backgroundColor(entry, palette)
      const baseAlpha = paintStyle === 'watercolor' ? 0.035 + intensity * 0.15 : paintStyle === 'inkwash' ? 0.045 + intensity * 0.2 : 0.075 + intensity * 0.3
      const repetitions = paintStyle === 'oil' ? 3 : paintStyle === 'pastel' ? 4 : 1
      for (let pass = 0; pass < repetitions; pass += 1) {
        const passRadius = radius * (0.92 + random() * 0.15)
        ctx.fillStyle = rgba(mixColors(color, palette.ink, layer * 0.05 + pass * 0.012), (baseAlpha - layer * 0.03) * style.backgroundAlpha)
        geometryPath(ctx, family, x + (random() - 0.5) * 9, y + (random() - 0.5) * 9, passRadius, random)
        ctx.fill()
      }
      if (intensity > 0.55 && layer === 0 && paintStyle !== 'watercolor') {
        ctx.strokeStyle = rgba(color, (paintStyle === 'inkwash' ? 0.11 : 0.16) + intensity * 0.18)
        ctx.lineWidth = paintStyle === 'pastel' ? 9 + intensity * 8 : 2 + intensity * 5
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

function curveForMove(row, random) {
  const start = squareCenter(row.from)
  const end = squareCenter(row.to)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const normalX = -dy / distance
  const normalY = dx / distance
  const bend = (random() - 0.5) * Math.min(CELL * 1.2, distance * 0.42)
  const mistakeBend = ['mistake', 'blunder'].includes(row.quality) ? (random() - 0.5) * CELL * 0.75 : 0
  return {
    start, end,
    c1: { x: start.x + dx * 0.32 + normalX * (bend + mistakeBend), y: start.y + dy * 0.32 + normalY * (bend + mistakeBend) },
    c2: { x: start.x + dx * 0.7 + normalX * bend * 0.45, y: start.y + dy * 0.7 + normalY * bend * 0.45 },
  }
}

function strokePath(ctx, curve) {
  ctx.beginPath()
  ctx.moveTo(curve.start.x, curve.start.y)
  ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.end.x, curve.end.y)
}

function pointOnCurve(curve, t) {
  const mt = 1 - t
  return {
    x: mt ** 3 * curve.start.x + 3 * mt ** 2 * t * curve.c1.x + 3 * mt * t ** 2 * curve.c2.x + t ** 3 * curve.end.x,
    y: mt ** 3 * curve.start.y + 3 * mt ** 2 * t * curve.c1.y + 3 * mt * t ** 2 * curve.c2.y + t ** 3 * curve.end.y,
  }
}

function paintStroke(ctx, row, palette, random, density, paintStyle) {
  const texture = QUALITY_TEXTURE[row.quality] || QUALITY_TEXTURE.good
  const style = PAINT_STYLES[paintStyle] || PAINT_STYLES.oil
  const importance = clamp((row.importance || 20) / 100)
  const densityFactor = density === 'airy' ? 0.82 : density === 'dense' ? 1.14 : 1
  const baseWidth = (9 + importance * 45) * texture.width * densityFactor * style.width
  const sideColor = row.color === 'w' ? palette.white : palette.black
  const color = row.motifs.includes('mat') ? palette.critical
    : row.motifs.includes('échec') ? mixColors(sideColor, palette.critical, 0.42)
      : row.captured ? mixColors(sideColor, palette.high, 0.34)
        : ['mistake', 'blunder'].includes(row.quality) ? mixColors(sideColor, palette.shadow, 0.32)
          : sideColor
  const curve = curveForMove(row, random)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = paintStyle === 'watercolor' ? 'screen' : paintStyle === 'inkwash' ? 'multiply' : 'source-over'

  if (paintStyle === 'watercolor') {
    ctx.strokeStyle = rgba(mixColors(color, palette.ink, 0.1), 0.045 + importance * 0.11)
    ctx.lineWidth = baseWidth * 2.15
  } else if (paintStyle === 'inkwash') {
    ctx.strokeStyle = rgba(mixColors(color, palette.shadow, 0.48), 0.18 + importance * 0.34)
    ctx.lineWidth = baseWidth * 1.08
  } else {
    ctx.strokeStyle = rgba(mixColors(color, palette.shadow, paintStyle === 'fresco' ? 0.32 : 0.18), style.opacity * texture.alpha * (0.22 + importance * 0.44))
    ctx.lineWidth = baseWidth * 1.16
  }
  strokePath(ctx, curve)
  ctx.stroke()

  const bristles = Math.round(style.bristles * (density === 'airy' ? 0.7 : density === 'dense' ? 1.25 : 1))
  for (let index = 0; index < bristles; index += 1) {
    const offset = (index - (bristles - 1) / 2) * baseWidth / bristles + (random() - 0.5) * baseWidth * texture.jitter
    ctx.save()
    ctx.translate(offset * (0.11 + random() * 0.08), offset * (0.04 + random() * 0.09))
    const pigment = index % 4 === 0 ? mixColors(color, palette.ink, paintStyle === 'oil' ? 0.2 : 0.08) : index % 5 === 0 ? mixColors(color, palette.shadow, 0.24) : color
    const alpha = paintStyle === 'watercolor'
      ? 0.035 + importance * 0.095 + random() * 0.045
      : style.opacity * texture.alpha * (0.12 + importance * 0.42) * (0.55 + random() * 0.45)
    ctx.strokeStyle = rgba(pigment, alpha)
    ctx.lineWidth = Math.max(1.2, baseWidth / bristles * (0.46 + random() * (paintStyle === 'oil' ? 1.35 : 0.9)))
    strokePath(ctx, curve)
    ctx.stroke()
    ctx.restore()
  }

  if (paintStyle === 'oil' || paintStyle === 'pastel' || paintStyle === 'fresco') {
    const deposits = Math.round((paintStyle === 'pastel' ? 58 : 28) * (0.45 + importance))
    for (let index = 0; index < deposits; index += 1) {
      const point = pointOnCurve(curve, random())
      const spread = baseWidth * (paintStyle === 'pastel' ? 0.65 : 0.38)
      const x = point.x + (random() - 0.5) * spread
      const y = point.y + (random() - 0.5) * spread
      ctx.fillStyle = rgba(index % 5 === 0 ? mixColors(color, palette.ink, 0.2) : color, paintStyle === 'pastel' ? 0.035 + random() * 0.09 : 0.08 + random() * 0.18)
      ctx.beginPath()
      ctx.ellipse(x, y, 0.8 + random() * (paintStyle === 'oil' ? 5 : 3), 0.5 + random() * 2, random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (paintStyle === 'watercolor') {
    for (let index = 0; index < 6; index += 1) {
      const point = pointOnCurve(curve, 0.08 + random() * 0.84)
      const bloom = baseWidth * (0.35 + random() * 0.55)
      const wash = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, bloom)
      wash.addColorStop(0, rgba(color, 0.035 + importance * 0.05))
      wash.addColorStop(0.78, rgba(color, 0.016))
      wash.addColorStop(1, rgba(color, 0))
      ctx.fillStyle = wash
      ctx.beginPath()
      ctx.arc(point.x, point.y, bloom, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalCompositeOperation = 'source-over'
  if (row.captured || row.motifs.includes('échec') || row.motifs.includes('mat')) {
    const count = row.motifs.includes('mat') ? 18 : row.captured ? 9 : 7
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2
      const radius = baseWidth * (0.35 + random() * 1.35)
      const dot = 2 + random() * baseWidth * 0.17
      ctx.fillStyle = rgba(row.motifs.includes('mat') ? palette.critical : color, (paintStyle === 'watercolor' ? 0.08 : 0.18) + random() * (paintStyle === 'pastel' ? 0.24 : 0.4))
      ctx.beginPath()
      ctx.arc(curve.end.x + Math.cos(angle) * radius, curve.end.y + Math.sin(angle) * radius, dot, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (row.quality === 'blunder' && paintStyle !== 'watercolor') {
    ctx.strokeStyle = rgba(palette.shadow, 0.55)
    ctx.lineWidth = Math.max(3, baseWidth * 0.1)
    ctx.beginPath()
    ctx.moveTo(curve.end.x - baseWidth * 0.38, curve.end.y - baseWidth * 0.36)
    ctx.lineTo(curve.end.x + baseWidth * 0.38, curve.end.y + baseWidth * 0.36)
    ctx.moveTo(curve.end.x + baseWidth * 0.34, curve.end.y - baseWidth * 0.4)
    ctx.lineTo(curve.end.x - baseWidth * 0.34, curve.end.y + baseWidth * 0.4)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSymbolGlyph(ctx, piece, theme, x, y, size, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.fillStyle = rgba(color, 0.18)
  ctx.lineWidth = Math.max(3, size * 0.055)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (theme === 'celestial') {
    const rays = piece.type === 'q' ? 10 : piece.type === 'k' ? 8 : piece.type === 'n' ? 5 : 6
    ctx.beginPath()
    for (let index = 0; index < rays * 2; index += 1) {
      const radius = index % 2 ? size * 0.22 : size * (piece.type === 'q' ? 0.5 : 0.4)
      const angle = -Math.PI / 2 + index * Math.PI / rays
      const px = Math.cos(angle) * radius
      const py = Math.sin(angle) * radius
      if (index === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.13, 0, Math.PI * 2)
    ctx.fillStyle = rgba(color, 0.72)
    ctx.fill()
  } else if (theme === 'oceanic') {
    const crests = piece.type === 'q' ? 4 : piece.type === 'k' ? 3 : 2
    for (let crest = 0; crest < crests; crest += 1) {
      const y = (crest - (crests - 1) / 2) * size * 0.16
      ctx.beginPath()
      ctx.moveTo(-size * 0.48, y)
      ctx.bezierCurveTo(-size * 0.2, y - size * 0.32, size * 0.04, y + size * 0.25, size * 0.48, y - size * 0.05)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
  } else if (theme === 'botanical') {
    const petals = piece.type === 'q' ? 9 : piece.type === 'k' ? 7 : piece.type === 'p' ? 3 : 5
    for (let petal = 0; petal < petals; petal += 1) {
      ctx.save()
      ctx.rotate(petal * Math.PI * 2 / petals)
      ctx.beginPath()
      ctx.ellipse(0, -size * 0.27, size * 0.13, size * 0.28, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = rgba(color, 0.64)
    ctx.fill()
  } else if (theme === 'tempest') {
    const bolts = piece.type === 'q' ? 4 : piece.type === 'k' ? 3 : 2
    for (let bolt = 0; bolt < bolts; bolt += 1) {
      const offset = (bolt - (bolts - 1) / 2) * size * 0.18
      ctx.beginPath()
      ctx.moveTo(offset - size * 0.12, -size * 0.48)
      ctx.lineTo(offset + size * 0.08, -size * 0.08)
      ctx.lineTo(offset - size * 0.02, -size * 0.08)
      ctx.lineTo(offset + size * 0.14, size * 0.48)
      ctx.stroke()
    }
  } else if (theme === 'cartography') {
    const rings = piece.type === 'q' ? 4 : piece.type === 'k' ? 3 : 2
    for (let ring = 1; ring <= rings; ring += 1) {
      ctx.beginPath()
      ctx.ellipse(0, 0, size * 0.12 * ring, size * 0.08 * ring, ring * 0.24, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(-size * 0.48, size * 0.32)
    ctx.quadraticCurveTo(0, -size * 0.3, size * 0.48, size * 0.12)
    ctx.stroke()
  } else {
    const sides = piece.type === 'p' ? 1 : piece.type === 'n' ? 3 : piece.type === 'b' ? 4 : piece.type === 'r' ? 6 : piece.type === 'q' ? 8 : 10
    if (sides === 1) {
      ctx.beginPath()
      ctx.arc(0, -size * 0.1, size * 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-size * 0.28, size * 0.38)
      ctx.quadraticCurveTo(0, -size * 0.05, size * 0.28, size * 0.38)
      ctx.stroke()
    } else {
      ctx.beginPath()
      for (let index = 0; index < sides; index += 1) {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / sides
        const radius = index % 2 ? size * 0.34 : size * 0.46
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius
        if (index === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  if (piece.wasCaptured) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = '#000'
    ctx.rotate(-0.55)
    ctx.fillRect(-size * 0.05, -size * 0.55, size * 0.1, size * 1.1)
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.restore()
}

function placeSymbols(analysis, palette, theme, level, random) {
  if (level === 'none') return []
  const candidates = (analysis.pieces || []).filter((piece) => piece.moveCount > 0)
  const limit = level === 'extended' ? 7 : 4
  const selected = candidates.slice(0, limit)
  const occupied = []
  return selected.map((piece, index) => {
    const anchor = squareCenter(piece.finalSquare)
    const size = CELL * clamp(0.34 + piece.importance / 300, 0.38, 0.72)
    const offsets = [
      [0, 0], [CELL * 0.3, 0], [-CELL * 0.3, 0], [0, CELL * 0.3], [0, -CELL * 0.3],
      [CELL * 0.25, CELL * 0.25], [-CELL * 0.25, -CELL * 0.25],
    ]
    let best = { x: anchor.x, y: anchor.y, cost: Infinity }
    for (const [dx, dy] of offsets) {
      const x = clamp(anchor.x + dx, MARGIN + size, SIZE - MARGIN - size)
      const y = clamp(anchor.y + dy, MARGIN + size, SIZE - MARGIN - size)
      const collision = occupied.reduce((sum, other) => sum + Math.max(0, (size + other.size) * 0.82 - Math.hypot(x - other.x, y - other.y)), 0)
      const edge = x < MARGIN + size || x > SIZE - MARGIN - size || y < MARGIN + size || y > SIZE - MARGIN - size ? 1000 : 0
      const cost = collision * 4 + edge + Math.hypot(dx, dy) * 0.1 + random() * 2
      if (cost < best.cost) best = { x, y, size, cost }
    }
    occupied.push(best)
    return { ...best, piece, theme, color: piece.color === 'w' ? palette.white : palette.black, rank: index + 1 }
  })
}

function drawSymbols(ctx, placements, palette, paintStyle) {
  for (const placement of placements.slice().reverse()) {
    const { piece, x, y, size, color, theme } = placement
    ctx.save()
    if (paintStyle !== 'watercolor') {
      ctx.beginPath()
      ctx.arc(x, y, size * 0.54, 0, Math.PI * 2)
      ctx.fillStyle = rgba(palette.background, paintStyle === 'inkwash' ? 0.22 : 0.34)
      ctx.fill()
    }
    drawSymbolGlyph(ctx, piece, theme, x, y, size, color)
    ctx.restore()
  }
}

function drawFinishingTexture(ctx, palette, paintStyle, random) {
  ctx.save()
  ctx.globalCompositeOperation = paintStyle === 'inkwash' ? 'multiply' : 'source-over'
  const marks = paintStyle === 'pastel' ? 4600 : paintStyle === 'fresco' ? 3400 : paintStyle === 'oil' ? 2300 : 1300
  for (let index = 0; index < marks; index += 1) {
    const x = random() * SIZE
    const y = random() * SIZE
    if (paintStyle === 'fresco' && random() > 0.965) {
      ctx.strokeStyle = rgba(palette.shadow, 0.09 + random() * 0.1)
      ctx.lineWidth = 0.5 + random() * 1.8
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let crack = 0; crack < 4; crack += 1) ctx.lineTo(x + (random() - 0.5) * 80, y + crack * (8 + random() * 16))
      ctx.stroke()
    } else if (paintStyle === 'oil') {
      ctx.fillStyle = rgba(random() > 0.6 ? palette.ink : palette.shadow, 0.006 + random() * 0.018)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(random() * Math.PI)
      ctx.fillRect(0, 0, 4 + random() * 22, 0.8 + random() * 2.5)
      ctx.restore()
    } else {
      const radius = paintStyle === 'pastel' ? 0.6 + random() * 2.2 : 0.4 + random() * 1.2
      ctx.fillStyle = rgba(random() > 0.58 ? palette.ink : palette.shadow, paintStyle === 'pastel' ? 0.012 + random() * 0.035 : 0.008 + random() * 0.02)
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (paintStyle === 'fresco') {
    const veil = ctx.createLinearGradient(0, 0, SIZE, SIZE)
    veil.addColorStop(0, rgba('#d9c99d', 0.035))
    veil.addColorStop(0.5, rgba('#8c6f54', 0.025))
    veil.addColorStop(1, rgba('#ead9ae', 0.045))
    ctx.fillStyle = veil
    ctx.fillRect(0, 0, SIZE, SIZE)
  }
  ctx.restore()
}

function drawStructureOverlay(ctx, heatmap, palette) {
  ctx.save()
  ctx.strokeStyle = rgba(palette.ink, 0.14)
  ctx.lineWidth = 2
  for (let index = 0; index <= 8; index += 1) {
    const coordinate = MARGIN + index * CELL
    ctx.beginPath()
    ctx.moveTo(MARGIN, coordinate)
    ctx.lineTo(SIZE - MARGIN, coordinate)
    ctx.moveTo(coordinate, MARGIN)
    ctx.lineTo(coordinate, SIZE - MARGIN)
    ctx.stroke()
  }
  ctx.fillStyle = rgba(palette.ink, 0.58)
  ctx.font = '22px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  for (let file = 0; file < 8; file += 1) ctx.fillText(String.fromCharCode(97 + file), MARGIN + (file + 0.5) * CELL, SIZE - MARGIN + 38)
  ctx.textAlign = 'right'
  for (let rank = 0; rank < 8; rank += 1) ctx.fillText(String(rank + 1), MARGIN - 22, MARGIN + (7 - rank + 0.58) * CELL)
  for (const hotspot of heatmap.hotspots.slice(0, 3)) {
    const center = squareCenter(hotspot.square)
    ctx.strokeStyle = rgba(palette.critical, 0.7)
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(center.x, center.y, CELL * 0.37, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFrameAndCaption(ctx, analysis, description, palette, placements) {
  ctx.save()
  ctx.strokeStyle = rgba(palette.ink, 0.12)
  ctx.lineWidth = 2
  ctx.strokeRect(32, 32, SIZE - 64, SIZE - 64)

  const titleGradient = ctx.createLinearGradient(0, 0, SIZE, 0)
  titleGradient.addColorStop(0, rgba(palette.shadow, 0.92))
  titleGradient.addColorStop(0.7, rgba(palette.shadow, 0.72))
  titleGradient.addColorStop(1, rgba(palette.shadow, 0.06))
  ctx.fillStyle = titleGradient
  ctx.fillRect(0, 0, SIZE, 96)
  ctx.fillStyle = palette.ink
  ctx.font = '600 40px Georgia, serif'
  ctx.textAlign = 'left'
  ctx.fillText(description.title, 64, 63, SIZE - 200)
  ctx.font = '19px Inter, Arial, sans-serif'
  ctx.fillStyle = rgba(palette.ink, 0.62)
  const players = `${analysis.headers.White || 'Blancs'} × ${analysis.headers.Black || 'Noirs'} · ${analysis.opening?.label || 'Ouverture libre'} · ${analysis.result}`
  ctx.fillText(players, 64, SIZE - 50, SIZE - 128)

  if (placements.length) {
    ctx.textAlign = 'right'
    const names = placements.slice(0, 3).map(({ piece }) => `${piece.color === 'w' ? 'B' : 'N'}·${piece.type.toUpperCase()}`).join('  ')
    ctx.fillText(`Figures : ${names}`, SIZE - 64, SIZE - 50)
  }
  ctx.restore()
}

function resolveFamily(requested, seed) {
  if (requested && requested !== 'automatic') return requested
  return ['organic', 'circles', 'triangles', 'diamonds'][seed % 4]
}

function resolvePaintStyle(requested, analysis, seed) {
  if (requested && requested !== 'automatic' && PAINT_STYLES[requested]) return requested
  if (['king-storm', 'sacrifice', 'chaos', 'counterstroke'].includes(analysis.theme?.id)) return seed % 2 ? 'oil' : 'inkwash'
  return ['oil', 'watercolor', 'pastel', 'fresco'][seed % 4]
}

function resolveTheme(requested, analysis, seed) {
  if (requested && requested !== 'automatic') return requested
  if (analysis.theme?.id === 'king-storm') return 'tempest'
  if (analysis.theme?.id === 'promotion') return 'celestial'
  if (analysis.theme?.id === 'center-clash') return 'cartography'
  return ['abstract', 'celestial', 'oceanic', 'botanical', 'tempest', 'cartography'][seed % 6]
}

export function renderPainting(canvas, analysis, sourcePgn, options = {}) {
  const mode = options.mode || 'painting'
  const variation = Number(options.variation || 0)
  const seed = hashText(`${sourcePgn}|paint-first-1.4|${variation}`)
  const random = randomGenerator(seed)
  const palette = choosePalette(analysis, options.palette || 'automatic', seed)
  const family = resolveFamily(options.backgroundShape || 'automatic', seed)
  const paintStyle = resolvePaintStyle(options.paintStyle || 'automatic', analysis, seed)
  const symbolTheme = resolveTheme(options.symbolTheme || 'automatic', analysis, seed)
  const density = options.density || 'balanced'
  const symbolLevel = options.symbolLevel || 'primary'
  const heatmapData = buildHeatmapData(analysis)
  const description = describeHeatmap(analysis, heatmapData, mode)

  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, SIZE, SIZE)
  fillCanvas(ctx, palette, random, paintStyle)
  drawUniverseAtmosphere(ctx, heatmapData, palette, symbolTheme, random)
  drawHeatShapes(ctx, heatmapData, palette, family, random, density, paintStyle)

  const strokes = [...analysis.rows].sort((a, b) => {
    const layerA = a.motifs.includes('mat') ? 1000 : a.importance || 0
    const layerB = b.motifs.includes('mat') ? 1000 : b.importance || 0
    return layerA - layerB || a.index - b.index
  })
  for (const row of strokes) paintStroke(ctx, row, palette, random, density, paintStyle)

  const placements = placeSymbols(analysis, palette, symbolTheme, symbolLevel, random)
  drawSymbols(ctx, placements, palette, paintStyle)
  drawFinishingTexture(ctx, palette, paintStyle, random)
  if (mode === 'structure') drawStructureOverlay(ctx, heatmapData, palette)
  if (mode === 'caption' || mode === 'structure') drawFrameAndCaption(ctx, analysis, description, palette, placements)

  return {
    heatmapData, description, palette, family, paintStyle, paintStyleLabel: PAINT_STYLES[paintStyle].label, symbolTheme, placements, variation,
    strokeOrder: strokes.map((row) => row.index),
  }
}

export function createPreservationMask(analysis, sourcePgn, options = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, SIZE, SIZE)
  const variation = Number(options.variation || 0)
  const seed = hashText(`${sourcePgn}|paint-first-1.4|${variation}`)
  const random = randomGenerator(seed)
  const heatmap = buildHeatmapData(analysis)

  for (const hotspot of heatmap.hotspots.slice(0, 8)) {
    const center = squareCenter(hotspot.square)
    const radius = CELL * (0.22 + clamp(hotspot.intensity / 2.4) * 0.52)
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${0.38 + clamp(hotspot.intensity / 2.4) * 0.42})`)
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const important = [...analysis.rows].filter((row) => (row.importance || 0) >= 45 || row.captured || row.motifs.includes('échec') || row.motifs.includes('mat'))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const row of important) {
    const importance = clamp((row.importance || 35) / 100)
    ctx.strokeStyle = `rgba(255,255,255,${0.36 + importance * 0.62})`
    ctx.lineWidth = 28 + importance * 72
    strokePath(ctx, curveForMove(row, random))
    ctx.stroke()
  }

  for (const piece of (analysis.pieces || []).slice(0, options.symbolLevel === 'extended' ? 7 : 4)) {
    const center = squareCenter(piece.finalSquare)
    ctx.fillStyle = `rgba(255,255,255,${piece.wasCaptured ? 0.52 : 0.86})`
    ctx.beginPath()
    ctx.arc(center.x, center.y, CELL * 0.34, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

export function downloadPainting(canvas, filename = 'chess-paint.png') {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }, 'image/png')
}
