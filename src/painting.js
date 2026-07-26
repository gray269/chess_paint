const SIZE = 1200
const MARGIN = 105
const BOARD_SIZE = SIZE - MARGIN * 2

const WHITE_PIECE_BASE = {
  p: '#d9a35d',
  n: '#d46a56',
  b: '#79b99a',
  r: '#6587d7',
  q: '#a771d5',
  k: '#efe2a5',
}

const THEMES = {
  'king-storm': {
    background: ['#140c15', '#382136', '#662941'],
    accent: '#fff0d0',
    haze: ['#ff8f62', '#c95ef4'],
    mode: 'vortex',
  },
  sacrifice: {
    background: ['#17100e', '#39211f', '#6b3825'],
    accent: '#ffe0a2',
    haze: ['#ff7e54', '#f2cb7d'],
    mode: 'ember',
  },
  chaos: {
    background: ['#100f1a', '#2b213d', '#5c2455'],
    accent: '#f5f1ff',
    haze: ['#ff5e86', '#6bc8ff'],
    mode: 'fracture',
  },
  endgame: {
    background: ['#11161c', '#24303a', '#344756'],
    accent: '#eaf5ff',
    haze: ['#d6c1a1', '#8fb5c8'],
    mode: 'geometry',
  },
  exchange: {
    background: ['#17120f', '#342820', '#6b5338'],
    accent: '#f3e3bf',
    haze: ['#f0ab61', '#98afbc'],
    mode: 'erosion',
  },
  positional: {
    background: ['#0f1715', '#1f312a', '#395244'],
    accent: '#eef9de',
    haze: ['#d1e4ab', '#7aa6b3'],
    mode: 'weave',
  },
  duel: {
    background: ['#121018', '#2a2439', '#49385f'],
    accent: '#f8e8d0',
    haze: ['#f0b56d', '#8ca0dd'],
    mode: 'duality',
  },
  counterstroke: {
    background: ['#100f16', '#27273f', '#23324f'],
    accent: '#f1f0ff',
    haze: ['#ffaa6b', '#7dd8ff'],
    mode: 'ripple',
  },
  'center-clash': {
    background: ['#17110d', '#392218', '#5e3426'],
    accent: '#fff3d0',
    haze: ['#ffb05f', '#b66ef6'],
    mode: 'core',
  },
  'wing-race': {
    background: ['#11111b', '#202d4a', '#31406b'],
    accent: '#eaf2ff',
    haze: ['#f0ca84', '#73d6d1'],
    mode: 'sweep',
  },
  fortress: {
    background: ['#101513', '#22332f', '#3d514a'],
    accent: '#e0f3e3',
    haze: ['#c7d9b5', '#889cb8'],
    mode: 'citadel',
  },
  promotion: {
    background: ['#171017', '#2f2140', '#58456d'],
    accent: '#fff3e5',
    haze: ['#ffcb7f', '#95a7ff'],
    mode: 'ascension',
  },
}

const QUALITY = {
  brilliant: { width: 10, jitter: 1, alpha: 1, glow: 34, texture: 1.2 },
  best: { width: 8.5, jitter: 1.6, alpha: 0.96, glow: 22, texture: 1.05 },
  excellent: { width: 7.2, jitter: 2.8, alpha: 0.92, glow: 15, texture: 1 },
  good: { width: 6.2, jitter: 6, alpha: 0.84, glow: 10, texture: 0.9 },
  inaccuracy: { width: 6.5, jitter: 16, alpha: 0.76, glow: 4, texture: 0.82 },
  mistake: { width: 8.5, jitter: 32, alpha: 0.68, glow: 0, texture: 0.76 },
  blunder: { width: 11, jitter: 50, alpha: 0.64, glow: 0, texture: 0.72 },
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
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

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const bigint = Number.parseInt(value, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsl({ r, g, b }) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const lightness = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: lightness }
  const difference = max - min
  const saturation = lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min)
  let hue
  switch (max) {
    case rr:
      hue = (gg - bb) / difference + (gg < bb ? 6 : 0)
      break
    case gg:
      hue = (bb - rr) / difference + 2
      break
    default:
      hue = (rr - gg) / difference + 4
      break
  }
  hue /= 6
  return { h: hue * 360, s: saturation, l: lightness }
}

function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360 / 360
  if (s === 0) {
    const value = l * 255
    return { r: value, g: value, b: value }
  }
  const hueToRgb = (p, q, t) => {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return p + (q - p) * 6 * temp
    if (temp < 1 / 2) return q
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: hueToRgb(p, q, hue + 1 / 3) * 255,
    g: hueToRgb(p, q, hue) * 255,
    b: hueToRgb(p, q, hue - 1 / 3) * 255,
  }
}

function adjustColor(hex, { hueShift = 0, saturation = 0, lightness = 0 } = {}) {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({
    h: hsl.h + hueShift,
    s: clamp(hsl.s + saturation, 0, 1),
    l: clamp(hsl.l + lightness, 0, 1),
  }))
}

function complementColor(hex) {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(hslToRgb({
    h: hsl.h + 180,
    s: clamp(hsl.s * 0.96 + 0.02, 0, 1),
    l: clamp(0.54 - (hsl.l - 0.5) * 0.22, 0.2, 0.78),
  }))
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function pieceColor(piece, color, index, random) {
  const base = WHITE_PIECE_BASE[piece] || '#ffffff'
  const source = color === 'w' ? base : complementColor(base)
  const hueShift = (index % 5 - 2) * 1.3 + (random() - 0.5) * 3
  const lightness = color === 'w' ? (random() - 0.5) * 0.03 : -0.03 + (random() - 0.5) * 0.03
  return adjustColor(source, { hueShift, lightness })
}

function chooseTheme(analysis) {
  return THEMES[analysis.theme.id] || THEMES.duel
}

function paintBoardAura(ctx, palette) {
  ctx.save()
  const gradient = ctx.createRadialGradient(SIZE * 0.5, SIZE * 0.46, 70, SIZE * 0.5, SIZE * 0.5, SIZE * 0.72)
  gradient.addColorStop(0, palette.background[2] || palette.background[1])
  gradient.addColorStop(0.55, palette.background[1])
  gradient.addColorStop(1, palette.background[0])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.restore()
}

function paintAmbientStrokes(ctx, palette, random) {
  ctx.save()
  ctx.globalAlpha = 0.1
  for (let index = 0; index < 85; index += 1) {
    const color = palette.haze[index % palette.haze.length]
    const x = random() * SIZE
    const y = random() * SIZE
    const length = 120 + random() * 250
    const angle = random() * Math.PI * 2
    ctx.strokeStyle = withAlpha(color, 0.12 + random() * 0.08)
    ctx.lineWidth = 20 + random() * 50
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.6) * length * 0.35,
      y + Math.sin(angle + 0.6) * length * 0.35,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawThemeBackdrop(ctx, palette, mode, random) {
  ctx.save()
  switch (mode) {
    case 'vortex': {
      ctx.translate(SIZE / 2, SIZE / 2)
      for (let i = 0; i < 24; i += 1) {
        const radius = 85 + i * 24
        ctx.strokeStyle = withAlpha(palette.haze[i % palette.haze.length], 0.09)
        ctx.lineWidth = 4 + (i % 3)
        ctx.beginPath()
        ctx.arc(0, 0, radius, i * 0.22, i * 0.22 + Math.PI * 1.28)
        ctx.stroke()
      }
      break
    }
    case 'ember': {
      for (let i = 0; i < 34; i += 1) {
        const x = random() * SIZE
        const y = SIZE * 0.15 + random() * SIZE * 0.7
        ctx.fillStyle = withAlpha(palette.haze[i % palette.haze.length], 0.09)
        ctx.beginPath()
        ctx.ellipse(x, y, 22 + random() * 38, 60 + random() * 90, random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'fracture': {
      for (let i = 0; i < 18; i += 1) {
        ctx.strokeStyle = withAlpha(palette.haze[i % palette.haze.length], 0.09)
        ctx.lineWidth = 2 + random() * 4
        const startX = random() * SIZE
        const startY = random() * SIZE
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        for (let step = 0; step < 4; step += 1) {
          ctx.lineTo(startX + (random() - 0.5) * 220, startY + (random() - 0.5) * 220)
        }
        ctx.stroke()
      }
      break
    }
    case 'geometry': {
      const cell = BOARD_SIZE / 4
      ctx.strokeStyle = withAlpha(palette.accent, 0.08)
      ctx.lineWidth = 2
      for (let i = 0; i <= 4; i += 1) {
        ctx.beginPath()
        ctx.moveTo(MARGIN + i * cell, MARGIN)
        ctx.lineTo(MARGIN + i * cell, SIZE - MARGIN)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(MARGIN, MARGIN + i * cell)
        ctx.lineTo(SIZE - MARGIN, MARGIN + i * cell)
        ctx.stroke()
      }
      break
    }
    case 'erosion': {
      for (let i = 0; i < 70; i += 1) {
        ctx.fillStyle = withAlpha(palette.haze[i % palette.haze.length], 0.045)
        ctx.fillRect(random() * SIZE, random() * SIZE, 18 + random() * 80, 6 + random() * 18)
      }
      break
    }
    case 'weave': {
      ctx.strokeStyle = withAlpha(palette.accent, 0.06)
      for (let i = 0; i < 22; i += 1) {
        const y = MARGIN + i * (BOARD_SIZE / 21)
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(MARGIN, y)
        ctx.bezierCurveTo(MARGIN + 180, y - 30, SIZE - MARGIN - 180, y + 30, SIZE - MARGIN, y)
        ctx.stroke()
      }
      break
    }
    case 'ripple': {
      const center = { x: SIZE * 0.52, y: SIZE * 0.48 }
      for (let i = 0; i < 16; i += 1) {
        ctx.strokeStyle = withAlpha(palette.haze[i % palette.haze.length], 0.08)
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.ellipse(center.x + i * 5, center.y - i * 6, 70 + i * 28, 30 + i * 18, i * 0.12, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
    case 'core': {
      ctx.translate(SIZE / 2, SIZE / 2)
      for (let i = 0; i < 12; i += 1) {
        ctx.fillStyle = withAlpha(palette.haze[i % palette.haze.length], 0.055)
        ctx.beginPath()
        ctx.moveTo(0, -20 - i * 15)
        ctx.lineTo(18 + i * 9, 0)
        ctx.lineTo(0, 20 + i * 15)
        ctx.lineTo(-18 - i * 9, 0)
        ctx.closePath()
        ctx.fill()
        ctx.rotate(Math.PI / 6)
      }
      break
    }
    case 'sweep': {
      for (let i = 0; i < 22; i += 1) {
        ctx.strokeStyle = withAlpha(palette.haze[i % palette.haze.length], 0.07)
        ctx.lineWidth = 12 + random() * 20
        ctx.beginPath()
        ctx.arc(MARGIN - 100 + i * 18, SIZE * 0.5, 180 + i * 18, -Math.PI / 4, Math.PI / 4)
        ctx.stroke()
      }
      break
    }
    case 'citadel': {
      ctx.strokeStyle = withAlpha(palette.accent, 0.08)
      ctx.lineWidth = 3
      for (let i = 0; i < 9; i += 1) {
        const inset = MARGIN - 10 + i * 28
        ctx.strokeRect(inset, inset, SIZE - inset * 2, SIZE - inset * 2)
      }
      break
    }
    case 'ascension': {
      for (let i = 0; i < 30; i += 1) {
        const x = MARGIN + random() * BOARD_SIZE
        ctx.strokeStyle = withAlpha(palette.haze[i % palette.haze.length], 0.08)
        ctx.lineWidth = 2 + random() * 5
        ctx.beginPath()
        ctx.moveTo(x, SIZE - MARGIN)
        ctx.bezierCurveTo(x - 20, SIZE * 0.72, x + 20, SIZE * 0.38, x + (random() - 0.5) * 120, MARGIN + 20)
        ctx.stroke()
      }
      break
    }
    default:
      for (let i = 0; i < 28; i += 1) {
        const x = random() * SIZE
        const y = random() * SIZE
        ctx.fillStyle = withAlpha(palette.haze[i % palette.haze.length], 0.05)
        ctx.beginPath()
        ctx.arc(x, y, 30 + random() * 70, 0, Math.PI * 2)
        ctx.fill()
      }
      break
  }
  ctx.restore()
}

function paintBackground(ctx, palette, random, analysis) {
  paintBoardAura(ctx, palette)
  paintAmbientStrokes(ctx, palette, random)
  drawThemeBackdrop(ctx, palette, palette.mode, random)

  ctx.save()
  ctx.globalAlpha = 0.065
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 1.1
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

  if (analysis.opening) {
    drawOpeningSigil(ctx, analysis.opening, palette, random)
  }
}

function drawOpeningSigil(ctx, opening, palette, random) {
  const center = { x: SIZE - MARGIN - 125, y: MARGIN + 110 }
  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.strokeStyle = withAlpha(palette.accent, 0.45)
  ctx.fillStyle = withAlpha(palette.accent, 0.08)
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, 62, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const symbol = opening.symbol || 'spiral'
  const drawLine = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() }
  switch (symbol) {
    case 'arch':
      ctx.beginPath(); ctx.arc(0, 12, 28, Math.PI, Math.PI * 2); ctx.stroke();
      drawLine(-28, 12, -28, -26); drawLine(28, 12, 28, -26)
      break
    case 'laurel':
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath(); ctx.ellipse(-18 + i * 5, -8 - i * 4, 10, 4, -0.6, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.ellipse(18 - i * 5, -8 - i * 4, 10, 4, 0.6, 0, Math.PI * 2); ctx.stroke()
      }
      break
    case 'wave':
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath(); ctx.moveTo(-42, i * 10); ctx.bezierCurveTo(-20, i * 10 - 18, 20, i * 10 + 18, 42, i * 10); ctx.stroke()
      }
      break
    case 'flame':
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(24, -18, 26, 6, 0, 38); ctx.bezierCurveTo(-24, 6, -26, -18, 0, -46); ctx.stroke()
      break
    case 'orb':
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.stroke();
      drawLine(-36, 0, 36, 0); drawLine(0, -36, 0, 36)
      break
    case 'mirror':
      drawLine(-30, -35, -6, 35); drawLine(30, -35, 6, 35); drawLine(-10, -8, 10, -8)
      break
    case 'spire':
      drawLine(0, -42, 0, 38); drawLine(-22, 12, 0, -42); drawLine(22, 12, 0, -42)
      break
    case 'mesh':
      for (let i = -2; i <= 2; i += 1) {
        drawLine(-36, i * 12, 36, i * 12)
        drawLine(i * 12, -36, i * 12, 36)
      }
      break
    case 'crescent':
      ctx.beginPath(); ctx.arc(-6, 0, 24, Math.PI * 0.35, Math.PI * 1.65); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, 0, 18, Math.PI * 0.45, Math.PI * 1.55); ctx.stroke();
      break
    default:
      ctx.beginPath()
      for (let i = 0; i < 32; i += 1) {
        const angle = i * 0.36
        const radius = 6 + i * 1.2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      break
  }

  ctx.globalAlpha = 0.62
  ctx.fillStyle = palette.accent
  ctx.textAlign = 'center'
  ctx.font = '600 13px system-ui, sans-serif'
  ctx.fillText(opening.label, 0, 92)
  ctx.restore()
}

function drawImpastoStroke(ctx, start, end, config, color, random, progress) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const perpendicularX = distance ? -dy / distance : 0
  const perpendicularY = distance ? dx / distance : 0
  const bend = (random() - 0.5) * (86 + config.jitter * 2.2)
  const phaseWave = Math.sin(progress * Math.PI * 2) * 24
  const control1 = {
    x: start.x + dx * 0.33 + perpendicularX * (bend + phaseWave),
    y: start.y + dy * 0.33 + perpendicularY * (bend + phaseWave),
  }
  const control2 = {
    x: start.x + dx * 0.66 - perpendicularX * (bend * 0.55),
    y: start.y + dy * 0.66 - perpendicularY * (bend * 0.55),
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.globalAlpha = config.alpha * 0.22
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.12 }), 0.35)
  ctx.lineWidth = config.width * 2.5
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y)
  ctx.stroke()

  const passes = 4
  for (let pass = 0; pass < passes; pass += 1) {
    const offset = (pass - (passes - 1) / 2) * (config.width * 0.22)
    ctx.globalAlpha = config.alpha * (0.7 - pass * 0.09)
    ctx.strokeStyle = pass === 0
      ? color
      : adjustColor(color, { lightness: 0.04 - pass * 0.03, saturation: 0.02 })
    ctx.lineWidth = config.width * (1 - pass * 0.08)
    ctx.shadowColor = color
    ctx.shadowBlur = pass === 0 ? config.glow : Math.max(0, config.glow - 10)
    ctx.beginPath()
    ctx.moveTo(start.x + perpendicularX * offset, start.y + perpendicularY * offset)
    ctx.bezierCurveTo(
      control1.x + perpendicularX * offset,
      control1.y + perpendicularY * offset,
      control2.x + perpendicularX * offset,
      control2.y + perpendicularY * offset,
      end.x + perpendicularX * offset,
      end.y + perpendicularY * offset,
    )
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  for (let i = 0; i < 12; i += 1) {
    const t = i / 11
    const x = Math.pow(1 - t, 3) * start.x
      + 3 * Math.pow(1 - t, 2) * t * control1.x
      + 3 * (1 - t) * Math.pow(t, 2) * control2.x
      + Math.pow(t, 3) * end.x
    const y = Math.pow(1 - t, 3) * start.y
      + 3 * Math.pow(1 - t, 2) * t * control1.y
      + 3 * (1 - t) * Math.pow(t, 2) * control2.y
      + Math.pow(t, 3) * end.y
    const rotation = Math.atan2(dy, dx) + (random() - 0.5) * 0.3
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.fillStyle = withAlpha(adjustColor(color, { lightness: 0.1 }), 0.09)
    ctx.fillRect(-config.width * 0.7, -config.width * 0.14, config.width * 1.4, config.width * 0.28)
    ctx.restore()
  }

  ctx.restore()
}

function drawDryBrushStroke(ctx, start, end, config, color, random) {
  const segments = 20
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
    if (random() < 0.35) {
      ctx.globalAlpha *= 0.6
      ctx.lineWidth = config.width * 0.4
      ctx.beginPath()
      ctx.moveTo(points[index - 1].x + (random() - 0.5) * 10, points[index - 1].y + (random() - 0.5) * 10)
      ctx.lineTo(points[index].x + (random() - 0.5) * 10, points[index].y + (random() - 0.5) * 10)
      ctx.stroke()
      ctx.globalAlpha = config.alpha
      ctx.lineWidth = config.width
    }
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

function drawCaptureMotif(ctx, point, color, random) {
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.strokeStyle = withAlpha(color, 0.38)
  ctx.fillStyle = withAlpha(adjustColor(color, { lightness: 0.1 }), 0.08)
  ctx.lineWidth = 2.4
  for (let petal = 0; petal < 6; petal += 1) {
    const angle = (Math.PI * 2 * petal) / 6
    ctx.rotate(Math.PI / 3)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(12, -10, 26, -6, 30, 0)
    ctx.bezierCurveTo(26, 6, 12, 10, 0, 0)
    ctx.fill()
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, 10 + random() * 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawCheckMotif(ctx, point, color, isMate) {
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.strokeStyle = withAlpha(color, isMate ? 0.92 : 0.58)
  ctx.lineWidth = isMate ? 4.8 : 2.6
  const spikes = isMate ? 12 : 7
  const outer = isMate ? 82 : 46
  const inner = isMate ? 26 : 18
  for (let index = 0; index < spikes; index += 1) {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / spikes
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, isMate ? 30 : 18, 0, Math.PI * 2)
  ctx.stroke()
  if (isMate) {
    ctx.fillStyle = withAlpha(adjustColor(color, { lightness: 0.08 }), 0.08)
    ctx.beginPath()
    ctx.arc(0, 0, 56, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawCastlingMotif(ctx, point, color) {
  ctx.save()
  ctx.strokeStyle = withAlpha(color, 0.5)
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(point.x, point.y + 20, 55, Math.PI, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(point.x - 24, point.y + 18)
  ctx.lineTo(point.x + 24, point.y + 18)
  ctx.stroke()
  ctx.restore()
}

function drawPromotionMotif(ctx, point, color) {
  ctx.save()
  ctx.fillStyle = withAlpha(color, 0.2)
  ctx.strokeStyle = withAlpha(color, 0.72)
  ctx.lineWidth = 3
  ctx.translate(point.x, point.y)
  ctx.beginPath()
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 44 : 16
    const angle = -Math.PI / 2 + (index * Math.PI) / 5
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawPieceStamp(ctx, row, point, color, random) {
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: 0.08 }), 0.4)
  ctx.fillStyle = withAlpha(color, 0.14)
  ctx.lineWidth = 2
  switch (row.piece) {
    case 'p':
      ctx.beginPath(); ctx.arc(0, 0, 7 + random() * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break
    case 'n':
      ctx.beginPath();
      for (let i = 0; i < 20; i += 1) {
        const angle = i * 0.5
        const radius = 2 + i * 0.9
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      break
    case 'b':
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(14, 0); ctx.lineTo(0, 16); ctx.lineTo(-14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      break
    case 'r':
      ctx.fillRect(-12, -12, 24, 24); ctx.strokeRect(-12, -12, 24, 24)
      break
    case 'q':
      ctx.beginPath()
      for (let i = 0; i < 12; i += 1) {
        const radius = i % 2 === 0 ? 18 : 8
        const angle = -Math.PI / 2 + (i * Math.PI) / 6
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath(); ctx.fill(); ctx.stroke()
      break
    case 'k':
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke();
      break
    default:
      break
  }
  ctx.restore()
}

function drawMotifs(ctx, row, point, color, random) {
  if (row.motifs.includes('capture')) drawCaptureMotif(ctx, point, color, random)
  if (row.motifs.includes('échec')) drawCheckMotif(ctx, point, color, false)
  if (row.motifs.includes('mat')) drawCheckMotif(ctx, point, color, true)
  if (row.motifs.includes('promotion')) drawPromotionMotif(ctx, point, color)
  if (row.motifs.includes('roque')) drawCastlingMotif(ctx, point, color)
  drawPieceStamp(ctx, row, point, color, random)
}

function drawOilTexture(ctx, palette, random) {
  ctx.save()
  for (let i = 0; i < 1600; i += 1) {
    const x = random() * SIZE
    const y = random() * SIZE
    const w = 6 + random() * 26
    const h = 1 + random() * 4
    ctx.globalAlpha = 0.022 + random() * 0.02
    ctx.fillStyle = random() > 0.5 ? withAlpha(palette.accent, 0.1) : 'rgba(0,0,0,0.08)'
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((random() - 0.5) * 1.2)
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.restore()
  }
  ctx.restore()
}

function drawVarnish(ctx) {
  const glaze = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  glaze.addColorStop(0, 'rgba(255,255,255,0.05)')
  glaze.addColorStop(0.5, 'rgba(255,255,255,0.01)')
  glaze.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.save()
  ctx.globalAlpha = 0.32
  ctx.fillStyle = glaze
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.restore()
}

function drawSignature(ctx, analysis, palette) {
  const whiteName = analysis.headers.White || 'Blancs'
  const blackName = analysis.headers.Black || 'Noirs'
  const opening = analysis.opening?.label || 'Ouverture libre'
  ctx.save()
  ctx.fillStyle = palette.accent
  ctx.globalAlpha = 0.72
  ctx.font = '600 25px system-ui, sans-serif'
  ctx.fillText(`${whiteName} — ${blackName}`, MARGIN, SIZE - 62)
  ctx.globalAlpha = 0.48
  ctx.font = '18px system-ui, sans-serif'
  ctx.fillText(opening, MARGIN, SIZE - 34)
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
  const palette = chooseTheme(analysis)

  paintBackground(ctx, palette, random, analysis)

  analysis.rows.forEach((row, index) => {
    const start = squarePoint(row.from)
    const end = squarePoint(row.to)
    const config = QUALITY[row.quality] || QUALITY.good
    const color = pieceColor(row.piece, row.color, index, random)
    const progress = index / Math.max(1, analysis.rows.length - 1)

    const precision = row.color === 'w'
      ? analysis.players.white?.estimated || 1200
      : analysis.players.black?.estimated || 1200
    const levelFactor = clamp(precision / 1700, 0.48, 1.24)
    const adjusted = {
      ...config,
      jitter: config.jitter / levelFactor,
      width: config.width * (1.18 - Math.min(0.35, precision / 7000)),
    }

    ctx.globalCompositeOperation = index % 8 === 0 ? 'screen' : 'source-over'
    if (['mistake', 'blunder'].includes(row.quality)) {
      drawDryBrushStroke(ctx, start, end, adjusted, color, random)
      drawSplatter(ctx, end, color, row.quality === 'blunder' ? 1 : 0.55, random)
    } else {
      drawImpastoStroke(ctx, start, end, adjusted, color, random, progress)
    }

    if (random() < 0.2) drawSplatter(ctx, start, withAlpha(color, 0.45), 0.15, random)
    drawMotifs(ctx, row, end, color, random)
  })

  ctx.globalCompositeOperation = 'source-over'
  drawOilTexture(ctx, palette, random)
  drawVarnish(ctx)
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
