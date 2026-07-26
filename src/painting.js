const SIZE = 1200
const MARGIN = 105
const BOARD_SIZE = SIZE - MARGIN * 2

const THEMES = {
  'king-storm': {
    background: ['#170d16', '#352033'],
    white: ['#ffd58a', '#fff1c7', '#ff8e63'],
    black: ['#7dd4ff', '#7788ff', '#c77dff'],
    accent: '#fff4d0',
  },
  sacrifice: {
    background: ['#130e0c', '#39211c'],
    white: ['#ffcf70', '#ff7657', '#fff1bd'],
    black: ['#64d2d7', '#4179d6', '#a892ff'],
    accent: '#ffdf78',
  },
  chaos: {
    background: ['#100c18', '#29203b'],
    white: ['#ffb45f', '#ff5e73', '#f8e8a0'],
    black: ['#48d6d2', '#5977ff', '#d15fff'],
    accent: '#ffffff',
  },
  endgame: {
    background: ['#11151a', '#25303b'],
    white: ['#f5e3bd', '#d7c4a0', '#ffffff'],
    black: ['#80b6cf', '#9b9fc7', '#ccd9e0'],
    accent: '#e8f4ff',
  },
  exchange: {
    background: ['#15100d', '#30251f'],
    white: ['#e8c896', '#ffdca8', '#f0a56c'],
    black: ['#7299a9', '#6380a2', '#9bb6bd'],
    accent: '#f7e6c6',
  },
  positional: {
    background: ['#0f1412', '#1d3028'],
    white: ['#e9dfb9', '#c6e3b2', '#f9f1d3'],
    black: ['#69a6a3', '#597a9e', '#9d91ba'],
    accent: '#e7ffd8',
  },
  duel: {
    background: ['#111018', '#28243a'],
    white: ['#f0c982', '#f6e8c2', '#e7a36f'],
    black: ['#6bb3c5', '#697cc7', '#a17bca'],
    accent: '#f4e8cf',
  },
}

const QUALITY = {
  brilliant: { width: 8, jitter: 1, alpha: 1, glow: 28 },
  best: { width: 7, jitter: 1.5, alpha: 0.95, glow: 18 },
  excellent: { width: 6, jitter: 2.5, alpha: 0.9, glow: 12 },
  good: { width: 5, jitter: 5, alpha: 0.82, glow: 7 },
  inaccuracy: { width: 5, jitter: 14, alpha: 0.72, glow: 2 },
  mistake: { width: 7, jitter: 28, alpha: 0.65, glow: 0 },
  blunder: { width: 10, jitter: 48, alpha: 0.62, glow: 0 },
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

function choose(array, random) {
  return array[Math.floor(random() * array.length)]
}

function squarePoint(square) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const cell = BOARD_SIZE / 8
  return {
    x: MARGIN + file * cell + cell / 2,
    y: MARGIN + (7 - rank) * cell + cell / 2,
  }
}

function paintBackground(ctx, palette, random) {
  const gradient = ctx.createRadialGradient(SIZE * 0.48, SIZE * 0.42, 60, SIZE / 2, SIZE / 2, SIZE * 0.8)
  gradient.addColorStop(0, palette.background[1])
  gradient.addColorStop(1, palette.background[0])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.save()
  ctx.globalAlpha = 0.08
  for (let index = 0; index < 4500; index += 1) {
    const x = random() * SIZE
    const y = random() * SIZE
    const radius = random() * 1.7 + 0.2
    ctx.fillStyle = random() > 0.48 ? '#ffffff' : '#000000'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.055
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 1
  for (let index = 0; index <= 8; index += 1) {
    const coordinate = MARGIN + (BOARD_SIZE / 8) * index
    ctx.beginPath()
    ctx.moveTo(MARGIN, coordinate)
    ctx.lineTo(SIZE - MARGIN, coordinate)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(coordinate, MARGIN)
    ctx.lineTo(coordinate, SIZE - MARGIN)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSmoothStroke(ctx, start, end, config, color, random, progress) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const perpendicularX = distance ? -dy / distance : 0
  const perpendicularY = distance ? dx / distance : 0
  const bend = (random() - 0.5) * (80 + config.jitter * 2)
  const phaseWave = Math.sin(progress * Math.PI * 2) * 25

  const control1 = {
    x: start.x + dx * 0.33 + perpendicularX * (bend + phaseWave),
    y: start.y + dy * 0.33 + perpendicularY * (bend + phaseWave),
  }
  const control2 = {
    x: start.x + dx * 0.66 - perpendicularX * (bend * 0.55),
    y: start.y + dy * 0.66 - perpendicularY * (bend * 0.55),
  }

  ctx.save()
  ctx.globalAlpha = config.alpha
  ctx.strokeStyle = color
  ctx.lineWidth = config.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = config.glow
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y)
  ctx.stroke()

  ctx.globalAlpha *= 0.34
  ctx.lineWidth *= 2.6
  ctx.shadowBlur = 0
  ctx.stroke()
  ctx.restore()
}

function drawBrokenStroke(ctx, start, end, config, color, random) {
  const segments = 18
  const points = []
  for (let index = 0; index <= segments; index += 1) {
    const ratio = index / segments
    points.push({
      x: start.x + (end.x - start.x) * ratio + (random() - 0.5) * config.jitter,
      y: start.y + (end.y - start.y) * ratio + (random() - 0.5) * config.jitter,
    })
  }

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = config.width
  ctx.lineCap = 'round'
  ctx.globalAlpha = config.alpha
  for (let index = 1; index < points.length; index += 1) {
    if (random() < (config.jitter > 35 ? 0.28 : 0.14)) continue
    ctx.beginPath()
    ctx.moveTo(points[index - 1].x, points[index - 1].y)
    ctx.lineTo(points[index].x, points[index].y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSplatter(ctx, point, color, intensity, random) {
  ctx.save()
  ctx.fillStyle = color
  const count = 8 + Math.round(intensity * 20)
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2
    const distance = random() * (30 + intensity * 65)
    const radius = random() * (3 + intensity * 10) + 1
    ctx.globalAlpha = 0.15 + random() * 0.45
    ctx.beginPath()
    ctx.arc(
      point.x + Math.cos(angle) * distance,
      point.y + Math.sin(angle) * distance,
      radius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.restore()
}

function drawMotifs(ctx, row, point, color, random) {
  if (row.motifs.includes('capture')) {
    ctx.save()
    ctx.globalAlpha = 0.34
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(point.x, point.y, 17 + random() * 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  if (row.motifs.includes('échec') || row.motifs.includes('mat')) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = row.motifs.includes('mat') ? 0.9 : 0.5
    ctx.lineWidth = row.motifs.includes('mat') ? 5 : 2
    const rays = row.motifs.includes('mat') ? 16 : 8
    for (let index = 0; index < rays; index += 1) {
      const angle = (Math.PI * 2 * index) / rays + random() * 0.12
      const inner = 18
      const outer = row.motifs.includes('mat') ? 82 : 45
      ctx.beginPath()
      ctx.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner)
      ctx.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (row.motifs.includes('promotion')) {
    ctx.save()
    ctx.fillStyle = color
    ctx.globalAlpha = 0.8
    ctx.translate(point.x, point.y)
    ctx.beginPath()
    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? 42 : 16
      const angle = -Math.PI / 2 + (index * Math.PI) / 5
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  if (row.motifs.includes('roque')) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(point.x, point.y + 20, 55, Math.PI, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

function drawSignature(ctx, analysis, palette) {
  const whiteName = analysis.headers.White || 'Blancs'
  const blackName = analysis.headers.Black || 'Noirs'
  ctx.save()
  ctx.fillStyle = palette.accent
  ctx.globalAlpha = 0.7
  ctx.font = '600 25px system-ui, sans-serif'
  ctx.fillText(`${whiteName} — ${blackName}`, MARGIN, SIZE - 48)
  ctx.globalAlpha = 0.42
  ctx.font = '18px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(analysis.theme.label, SIZE - MARGIN, SIZE - 48)
  ctx.restore()
}

export function renderPainting(canvas, analysis, sourcePgn) {
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const seed = hashText(sourcePgn)
  const random = randomGenerator(seed)
  const palette = THEMES[analysis.theme.id] || THEMES.duel

  paintBackground(ctx, palette, random)

  analysis.rows.forEach((row, index) => {
    const start = squarePoint(row.from)
    const end = squarePoint(row.to)
    const config = QUALITY[row.quality] || QUALITY.good
    const colors = row.color === 'w' ? palette.white : palette.black
    const color = choose(colors, random)
    const progress = index / Math.max(1, analysis.rows.length - 1)

    const precision = row.color === 'w'
      ? analysis.players.white?.estimated || 1200
      : analysis.players.black?.estimated || 1200
    const levelFactor = Math.max(0.45, Math.min(1.25, precision / 1700))
    const adjusted = {
      ...config,
      jitter: config.jitter / levelFactor,
      width: config.width * (1.15 - Math.min(0.35, precision / 7000)),
    }

    ctx.globalCompositeOperation = index % 9 === 0 ? 'screen' : 'source-over'
    if (['mistake', 'blunder'].includes(row.quality)) {
      drawBrokenStroke(ctx, start, end, adjusted, color, random)
      drawSplatter(ctx, end, color, row.quality === 'blunder' ? 1 : 0.55, random)
    } else {
      drawSmoothStroke(ctx, start, end, adjusted, color, random, progress)
    }

    drawMotifs(ctx, row, end, color, random)
  })

  ctx.globalCompositeOperation = 'source-over'
  drawSignature(ctx, analysis, palette)
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
