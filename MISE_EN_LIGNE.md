const SIZE = 1200
const HORIZON = 455

const PIECE_VALUES = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 20 }

const WHITE_BASE = {
  p: '#d9b06a',
  n: '#bc7ac9',
  b: '#6ca8cb',
  r: '#4d74c4',
  q: '#d86b83',
  k: '#efe1a1',
}

const QUALITY_STYLE = {
  brilliant: { alpha: 0.95, trail: 0.75, width: 9, scale: 1.18 },
  best: { alpha: 0.92, trail: 0.65, width: 8, scale: 1.12 },
  excellent: { alpha: 0.9, trail: 0.58, width: 7, scale: 1.07 },
  good: { alpha: 0.84, trail: 0.48, width: 6, scale: 1.0 },
  inaccuracy: { alpha: 0.72, trail: 0.34, width: 5, scale: 0.96 },
  mistake: { alpha: 0.66, trail: 0.28, width: 5, scale: 0.92 },
  blunder: { alpha: 0.62, trail: 0.22, width: 4.5, scale: 0.88 },
}

const SCENE_PROFILES = {
  'mythic-antique': {
    sky: ['#f5d7ae', '#d8896e', '#6f597f'],
    ground: ['#7b6958', '#3e302f'],
    accents: ['#ffe7b2', '#f5a670', '#9cc5c8'],
    atmosphere: 'warm',
    environment: 'temple',
  },
  'romantic-storm': {
    sky: ['#f0b692', '#915a73', '#27304f'],
    ground: ['#4f413c', '#251f28'],
    accents: ['#f9dfb0', '#d5787a', '#88bad6'],
    atmosphere: 'storm',
    environment: 'cliff',
  },
  'alpine-calm': {
    sky: ['#d7e6ef', '#8db7c2', '#576e88'],
    ground: ['#7f8d74', '#3e4a45'],
    accents: ['#f4ead5', '#9bc0b6', '#d4a56d'],
    atmosphere: 'calm',
    environment: 'mountain',
  },
  'maritime-odyssey': {
    sky: ['#d8b58f', '#5ea2bf', '#1f436d'],
    ground: ['#4a676c', '#21343e'],
    accents: ['#fce3b1', '#85d7d0', '#4f75d1'],
    atmosphere: 'marine',
    environment: 'ocean',
  },
  'desert-epic': {
    sky: ['#f4d39f', '#d99667', '#76526b'],
    ground: ['#a98458', '#563e2f'],
    accents: ['#fff0c2', '#ed9b5a', '#c05757'],
    atmosphere: 'dry',
    environment: 'desert',
  },
  'forest-legend': {
    sky: ['#d9dbb9', '#7f9e84', '#30443c'],
    ground: ['#58684a', '#233127'],
    accents: ['#f3efda', '#8dc49b', '#6c91b6'],
    atmosphere: 'forest',
    environment: 'forest',
  },
  'courtly-renaissance': {
    sky: ['#f1dfc8', '#d7a98f', '#7b6a7f'],
    ground: ['#7c7f6a', '#423a39'],
    accents: ['#fff0d1', '#d36e88', '#91a8c8'],
    atmosphere: 'courtly',
    environment: 'garden',
  },
  'lunar-dream': {
    sky: ['#d9d6f0', '#7087b1', '#232742'],
    ground: ['#54607b', '#222739'],
    accents: ['#fff5d4', '#bca7ee', '#96d0dd'],
    atmosphere: 'night',
    environment: 'lake',
  },
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

function choose(array, random) {
  return array[Math.floor(random() * array.length)]
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const bigint = Number.parseInt(value, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
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
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  switch (max) {
    case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break
    case gg: h = (bb - rr) / d + 2; break
    default: h = (rr - gg) / d + 4; break
  }
  h /= 6
  return { h: h * 360, s, l }
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
    s: clamp(hsl.s * 0.95, 0, 1),
    l: clamp(0.55 - (hsl.l - 0.5) * 0.2, 0.18, 0.82),
  }))
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function pieceColor(piece, color, index, random) {
  const base = WHITE_BASE[piece] || '#ffffff'
  const source = color === 'w' ? base : complementColor(base)
  return adjustColor(source, {
    hueShift: (index % 6 - 2.5) * 1.8 + (random() - 0.5) * 3,
    lightness: color === 'w' ? (random() - 0.5) * 0.04 : -0.04 + (random() - 0.5) * 0.04,
  })
}

function sceneProfile(analysis) {
  return SCENE_PROFILES[analysis.scene?.id] || SCENE_PROFILES['mythic-antique']
}

function chooseCamera(random) {
  const options = [
    { xScale: 108, yScale: 56, skew: 18, groundY: 905, lift: 26 },
    { xScale: 98, yScale: 62, skew: -24, groundY: 930, lift: 30 },
    { xScale: 116, yScale: 50, skew: 0, groundY: 890, lift: 22 },
  ]
  return choose(options, random)
}

function squareToScene(square, camera) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const dx = file - 3.5
  const dy = rank - 3.5
  const x = SIZE / 2 + dx * camera.xScale + dy * camera.skew
  const y = camera.groundY - dy * camera.yScale - Math.abs(dx) * camera.lift
  return { x, y }
}

function pieceAdvantage(row) {
  return row.color === 'w' ? row.evalAfter : -row.evalAfter
}

function drawBackground(ctx, profile, random) {
  const sky = ctx.createLinearGradient(0, 0, 0, SIZE)
  sky.addColorStop(0, profile.sky[0])
  sky.addColorStop(0.45, profile.sky[1])
  sky.addColorStop(1, profile.sky[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, SIZE, SIZE)

  if (profile.atmosphere === 'night') {
    ctx.fillStyle = 'rgba(255,245,210,0.8)'
    ctx.beginPath()
    ctx.arc(930, 130, 56, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const sun = ctx.createRadialGradient(250, 170, 20, 250, 170, 160)
    sun.addColorStop(0, 'rgba(255,250,220,0.95)')
    sun.addColorStop(0.55, 'rgba(255,218,160,0.35)')
    sun.addColorStop(1, 'rgba(255,218,160,0)')
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, SIZE, SIZE)
  }

  drawEnvironment(ctx, profile, random)
  drawGround(ctx, profile, random)
  drawCanvasTexture(ctx, profile, random)
}

function drawEnvironment(ctx, profile, random) {
  ctx.save()
  switch (profile.environment) {
    case 'mountain':
      for (let i = 0; i < 5; i += 1) {
        ctx.fillStyle = withAlpha(i % 2 ? profile.sky[2] : profile.ground[0], 0.32 - i * 0.04)
        ctx.beginPath()
        ctx.moveTo(-50 + i * 220, HORIZON + 45)
        ctx.lineTo(150 + i * 220, 280 + random() * 180)
        ctx.lineTo(340 + i * 220, HORIZON + 45)
        ctx.closePath()
        ctx.fill()
      }
      break
    case 'ocean':
    case 'cliff':
      ctx.fillStyle = withAlpha(profile.accents[2], 0.18)
      ctx.fillRect(0, HORIZON + 55, SIZE, 150)
      for (let i = 0; i < 18; i += 1) {
        ctx.strokeStyle = withAlpha(profile.accents[0], 0.09)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, HORIZON + 80 + i * 12)
        ctx.bezierCurveTo(220, HORIZON + 55 + i * 12, 950, HORIZON + 105 + i * 10, SIZE, HORIZON + 85 + i * 12)
        ctx.stroke()
      }
      if (profile.environment === 'cliff') {
        ctx.fillStyle = withAlpha(profile.ground[1], 0.55)
        ctx.beginPath()
        ctx.moveTo(0, HORIZON + 170)
        ctx.lineTo(0, 360)
        ctx.lineTo(170, 455)
        ctx.lineTo(210, HORIZON + 170)
        ctx.closePath()
        ctx.fill()
      }
      break
    case 'desert':
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = withAlpha(i % 2 ? profile.ground[0] : profile.accents[0], 0.18)
        ctx.beginPath()
        ctx.moveTo(-80, HORIZON + 160 + i * 24)
        ctx.bezierCurveTo(250, HORIZON + 90 + i * 18, 770, HORIZON + 220 + i * 16, SIZE + 90, HORIZON + 110 + i * 28)
        ctx.lineTo(SIZE + 90, SIZE)
        ctx.lineTo(-80, SIZE)
        ctx.closePath()
        ctx.fill()
      }
      break
    case 'forest':
      for (let i = 0; i < 14; i += 1) {
        const x = 40 + i * 88 + random() * 25
        ctx.strokeStyle = withAlpha(profile.ground[1], 0.28)
        ctx.lineWidth = 12 + random() * 8
        ctx.beginPath()
        ctx.moveTo(x, SIZE)
        ctx.lineTo(x + random() * 40 - 20, 240 + random() * 260)
        ctx.stroke()
      }
      break
    case 'garden':
      for (let i = 0; i < 7; i += 1) {
        const x = 130 + i * 145
        ctx.strokeStyle = withAlpha(profile.accents[0], 0.18)
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(x, HORIZON + 50, 62, Math.PI, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = withAlpha(profile.ground[0], 0.12)
        ctx.fillRect(x - 18, HORIZON + 50, 36, 145)
      }
      break
    case 'lake':
      ctx.fillStyle = withAlpha(profile.accents[2], 0.15)
      ctx.beginPath()
      ctx.ellipse(SIZE / 2, HORIZON + 120, 320, 74, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'temple':
    default:
      for (let i = 0; i < 6; i += 1) {
        const x = 100 + i * 155
        ctx.fillStyle = withAlpha(profile.accents[0], 0.1)
        ctx.fillRect(x, HORIZON - 40 - random() * 20, 24, 220 + random() * 30)
        ctx.strokeStyle = withAlpha(profile.ground[1], 0.18)
        ctx.lineWidth = 3
        ctx.strokeRect(x, HORIZON - 40 - random() * 20, 24, 220 + random() * 30)
      }
      break
  }
  ctx.restore()
}

function drawGround(ctx, profile, random) {
  const ground = ctx.createLinearGradient(0, HORIZON, 0, SIZE)
  ground.addColorStop(0, withAlpha(profile.ground[0], 0.74))
  ground.addColorStop(1, withAlpha(profile.ground[1], 0.96))
  ctx.fillStyle = ground
  ctx.beginPath()
  ctx.moveTo(0, HORIZON + 110)
  ctx.bezierCurveTo(200, HORIZON + 80, 480, HORIZON + 150, SIZE, HORIZON + 95)
  ctx.lineTo(SIZE, SIZE)
  ctx.lineTo(0, SIZE)
  ctx.closePath()
  ctx.fill()

  for (let i = 0; i < 12; i += 1) {
    ctx.strokeStyle = withAlpha(profile.accents[0], 0.04)
    ctx.lineWidth = 22 + random() * 26
    ctx.beginPath()
    ctx.moveTo(60 + i * 105 + random() * 20, HORIZON + 140)
    ctx.bezierCurveTo(90 + i * 110, HORIZON + 210 + random() * 60, 40 + i * 100, SIZE - 130, 85 + i * 105, SIZE - 28)
    ctx.stroke()
  }
}

function drawCanvasTexture(ctx, profile, random) {
  ctx.save()
  for (let i = 0; i < 2200; i += 1) {
    ctx.globalAlpha = 0.014 + random() * 0.02
    ctx.fillStyle = random() > 0.5 ? withAlpha(profile.accents[0], 0.12) : 'rgba(0,0,0,0.08)'
    ctx.save()
    ctx.translate(random() * SIZE, random() * SIZE)
    ctx.rotate((random() - 0.5) * 1.4)
    ctx.fillRect(-8 - random() * 22, -1 - random() * 3, 16 + random() * 44, 1 + random() * 5)
    ctx.restore()
  }
  ctx.restore()
}

function drawPath(ctx, start, end, color, style, random) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const nx = distance ? -dy / distance : 0
  const ny = distance ? dx / distance : 0
  const bend = (random() - 0.5) * (50 + distance * 0.1)
  const control = {
    x: start.x + dx * 0.5 + nx * bend,
    y: start.y + dy * 0.4 + ny * bend - 24,
  }

  ctx.save()
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.08 }), style.trail * 0.4)
  ctx.lineWidth = style.width * 3.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y)
  ctx.stroke()

  for (let pass = 0; pass < 3; pass += 1) {
    ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: 0.04 - pass * 0.03 }), style.trail * (0.54 - pass * 0.12))
    ctx.lineWidth = style.width * (1.7 - pass * 0.24)
    ctx.beginPath()
    ctx.moveTo(start.x + nx * pass * 2, start.y + ny * pass * 2)
    ctx.quadraticCurveTo(control.x + nx * pass * 2, control.y + ny * pass * 2, end.x, end.y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBrushBurst(ctx, point, color, intensity, random) {
  ctx.save()
  for (let i = 0; i < 6 + intensity * 8; i += 1) {
    const angle = random() * Math.PI * 2
    const length = 16 + random() * 34 * intensity
    ctx.strokeStyle = withAlpha(color, 0.18 + random() * 0.18)
    ctx.lineWidth = 2 + random() * 5
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(point.x + Math.cos(angle) * length, point.y + Math.sin(angle) * length)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFigureShadow(ctx, x, y, scale) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(x, y + 8 * scale, 18 * scale, 7 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPawn(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(-1.08)
  ctx.fillStyle = withAlpha(color, 0.9)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.12 }), 0.55)
  ctx.lineWidth = 1.8 * scale
  ctx.beginPath(); ctx.arc(0, -26 * scale, 8 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -18 * scale); ctx.lineTo(0, 10 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-11 * scale, -4 * scale); ctx.lineTo(10 * scale, -10 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -4 * scale); ctx.lineTo(16 * scale, -23 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, 10 * scale); ctx.lineTo(-10 * scale, 26 * scale); ctx.moveTo(0, 10 * scale); ctx.lineTo(10 * scale, 26 * scale); ctx.stroke()
  ctx.restore()
}

function drawKnight(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(-0.9)
  ctx.fillStyle = withAlpha(color, 0.9)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.14 }), 0.55)
  ctx.lineWidth = 1.8 * scale
  ctx.beginPath(); ctx.ellipse(-8 * scale, 8 * scale, 18 * scale, 11 * scale, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-17 * scale, 0); ctx.lineTo(-32 * scale, -20 * scale); ctx.lineTo(-8 * scale, -32 * scale); ctx.quadraticCurveTo(9 * scale, -22 * scale, 10 * scale, -4 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(8 * scale, -3 * scale); ctx.lineTo(22 * scale, 18 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-18 * scale, 18 * scale); ctx.lineTo(-25 * scale, 35 * scale); ctx.moveTo(-5 * scale, 18 * scale); ctx.lineTo(-8 * scale, 35 * scale); ctx.moveTo(7 * scale, 12 * scale); ctx.lineTo(4 * scale, 32 * scale); ctx.stroke()
  ctx.restore()
}

function drawBishop(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(0.88)
  ctx.fillStyle = withAlpha(color, 0.88)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.14 }), 0.55)
  ctx.lineWidth = 1.8 * scale
  ctx.beginPath(); ctx.moveTo(0, -42 * scale); ctx.quadraticCurveTo(24 * scale, -15 * scale, 16 * scale, 16 * scale); ctx.lineTo(-16 * scale, 16 * scale); ctx.quadraticCurveTo(-24 * scale, -15 * scale, 0, -42 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -34 * scale); ctx.lineTo(0, -10 * scale); ctx.moveTo(-5 * scale, -22 * scale); ctx.lineTo(5 * scale, -22 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-18 * scale, 16 * scale); ctx.lineTo(-22 * scale, 28 * scale); ctx.lineTo(22 * scale, 28 * scale); ctx.lineTo(18 * scale, 16 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawRook(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(-0.7)
  ctx.fillStyle = withAlpha(color, 0.86)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.14 }), 0.55)
  ctx.lineWidth = 1.8 * scale
  ctx.fillRect(-18 * scale, -36 * scale, 36 * scale, 48 * scale)
  ctx.strokeRect(-18 * scale, -36 * scale, 36 * scale, 48 * scale)
  ctx.clearRect(-13 * scale, -36 * scale, 6 * scale, 9 * scale)
  ctx.clearRect(-3 * scale, -36 * scale, 6 * scale, 9 * scale)
  ctx.clearRect(7 * scale, -36 * scale, 6 * scale, 9 * scale)
  ctx.fillRect(-22 * scale, 12 * scale, 44 * scale, 10 * scale)
  ctx.strokeRect(-22 * scale, 12 * scale, 44 * scale, 10 * scale)
  ctx.restore()
}

function drawQueen(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(0.82)
  ctx.fillStyle = withAlpha(color, 0.9)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.15 }), 0.58)
  ctx.lineWidth = 1.8 * scale
  ctx.beginPath()
  ctx.moveTo(-22 * scale, 18 * scale)
  ctx.lineTo(-14 * scale, -16 * scale)
  ctx.lineTo(-5 * scale, -6 * scale)
  ctx.lineTo(0, -32 * scale)
  ctx.lineTo(5 * scale, -6 * scale)
  ctx.lineTo(14 * scale, -16 * scale)
  ctx.lineTo(22 * scale, 18 * scale)
  ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(-14 * scale, -18 * scale, 4 * scale, 0, Math.PI * 2); ctx.arc(0, -36 * scale, 4.5 * scale, 0, Math.PI * 2); ctx.arc(14 * scale, -18 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.moveTo(-24 * scale, 18 * scale); ctx.lineTo(24 * scale, 18 * scale); ctx.lineTo(20 * scale, 29 * scale); ctx.lineTo(-20 * scale, 29 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawKing(ctx, x, y, scale, color, state) {
  ctx.save()
  ctx.translate(x, y)
  if (state === 'fallen') ctx.rotate(-0.72)
  ctx.fillStyle = withAlpha(color, 0.92)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.18 }), 0.6)
  ctx.lineWidth = 1.9 * scale
  ctx.beginPath(); ctx.moveTo(-20 * scale, 18 * scale); ctx.lineTo(-12 * scale, -12 * scale); ctx.lineTo(12 * scale, -12 * scale); ctx.lineTo(20 * scale, 18 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.arc(0, -18 * scale, 12 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -43 * scale); ctx.lineTo(0, -12 * scale); ctx.moveTo(-11 * scale, -28 * scale); ctx.lineTo(11 * scale, -28 * scale); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-24 * scale, 18 * scale); ctx.lineTo(24 * scale, 18 * scale); ctx.lineTo(20 * scale, 29 * scale); ctx.lineTo(-20 * scale, 29 * scale); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawPieceFigure(ctx, piece, x, y, scale, color, state) {
  drawFigureShadow(ctx, x, y + 16 * scale, scale)
  switch (piece) {
    case 'p': drawPawn(ctx, x, y, scale, color, state); break
    case 'n': drawKnight(ctx, x, y, scale, color, state); break
    case 'b': drawBishop(ctx, x, y, scale, color, state); break
    case 'r': drawRook(ctx, x, y, scale, color, state); break
    case 'q': drawQueen(ctx, x, y, scale, color, state); break
    case 'k': drawKing(ctx, x, y, scale, color, state); break
    default: drawPawn(ctx, x, y, scale, color, state); break
  }
}

function drawExchangeMotif(ctx, point, color, balanced) {
  ctx.save()
  ctx.strokeStyle = withAlpha(color, balanced ? 0.28 : 0.18)
  ctx.lineWidth = balanced ? 2.4 : 1.5
  ctx.beginPath()
  ctx.arc(point.x, point.y - 18, balanced ? 34 : 22, 0, Math.PI * 2)
  ctx.stroke()
  if (balanced) {
    ctx.beginPath(); ctx.moveTo(point.x - 26, point.y - 18); ctx.lineTo(point.x + 26, point.y - 18); ctx.moveTo(point.x, point.y - 44); ctx.lineTo(point.x, point.y + 8); ctx.stroke()
  }
  ctx.restore()
}

function drawSceneTitle(ctx, analysis, profile) {
  ctx.save()
  ctx.fillStyle = withAlpha(profile.accents[0], 0.9)
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 12
  ctx.textAlign = 'center'
  ctx.font = '600 38px Georgia, serif'
  ctx.fillText(analysis.artworkTitle || analysis.theme.label, SIZE / 2, 76)
  ctx.shadowBlur = 0
  ctx.font = '18px Georgia, serif'
  ctx.fillStyle = withAlpha(profile.accents[0], 0.7)
  const sub = `${analysis.scene?.label || ''} · ${analysis.opening?.label || 'Ouverture libre'} · ${analysis.theme.label}`
  ctx.fillText(sub, SIZE / 2, 108)
  ctx.restore()
}

function drawCommentCartouche(ctx, analysis, profile) {
  ctx.save()
  ctx.fillStyle = 'rgba(20, 18, 23, 0.24)'
  ctx.strokeStyle = withAlpha(profile.accents[0], 0.26)
  roundRect(ctx, 72, 1018, 1056, 110, 18)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = withAlpha(profile.accents[0], 0.8)
  ctx.font = '600 21px Georgia, serif'
  ctx.fillText(analysis.headers.White || 'Blancs', 98, 1052)
  ctx.fillText('contre', 262, 1052)
  ctx.fillText(analysis.headers.Black || 'Noirs', 330, 1052)
  ctx.font = '17px Georgia, serif'
  const text = `${analysis.commentary}`
  wrapText(ctx, text, 98, 1085, 998, 22)
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const width = ctx.measureText(testLine).width
    if (width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
      if (currentY > y + 46) break
    } else {
      line = testLine
    }
  }
  if (line && currentY <= y + 46) ctx.fillText(line, x, currentY)
}

function figureState(row) {
  if (row.motifs.includes('mat')) return 'heroic'
  if (row.quality === 'blunder') return 'stagger'
  if (row.quality === 'mistake') return 'weakened'
  return 'active'
}

function buildFigureEvents(analysis, camera, random) {
  const events = []
  analysis.rows.forEach((row, index) => {
    const start = squareToScene(row.from, camera)
    const end = squareToScene(row.to, camera)
    const style = QUALITY_STYLE[row.quality] || QUALITY_STYLE.good
    const color = pieceColor(row.piece, row.color, index, random)
    const precision = row.color === 'w' ? analysis.players.white?.estimated || 1300 : analysis.players.black?.estimated || 1300
    const advantage = pieceAdvantage(row)
    const baseScale = 0.85 + Math.max(-0.18, Math.min(0.26, advantage / 1300)) + (style.scale - 1) * 0.5
    events.push({
      type: 'move',
      row,
      start,
      end,
      color,
      style,
      scale: baseScale + (precision - 1200) / 8000,
      state: figureState(row),
    })

    if (row.captured) {
      const capturedColor = pieceColor(row.captured, row.color === 'w' ? 'b' : 'w', index + 3, random)
      const valueDiff = Math.abs((PIECE_VALUES[row.piece] || 0) - (PIECE_VALUES[row.captured] || 0))
      events.push({
        type: 'capture',
        row,
        point: { x: end.x + 18 + (random() - 0.5) * 26, y: end.y + 24 + (random() - 0.5) * 18 },
        color: capturedColor,
        piece: row.captured,
        balanced: valueDiff <= 1.2,
      })
    }
  })
  return events
}

export function renderPainting(canvas, analysis, sourcePgn) {
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const seed = hashText(`${sourcePgn}|${analysis.artworkTitle || ''}|narrative`)
  const random = randomGenerator(seed)
  const profile = sceneProfile(analysis)
  const camera = chooseCamera(random)

  drawBackground(ctx, profile, random)
  drawSceneTitle(ctx, analysis, profile)

  const events = buildFigureEvents(analysis, camera, random)

  for (const event of events.filter((entry) => entry.type === 'move')) {
    drawPath(ctx, event.start, event.end, event.color, event.style, random)
    if (event.row.quality === 'mistake' || event.row.quality === 'blunder') {
      drawBrushBurst(ctx, event.end, event.color, event.row.quality === 'blunder' ? 1.5 : 1, random)
    }
    if (event.row.motifs.includes('échec') || event.row.motifs.includes('mat')) {
      drawBrushBurst(ctx, event.end, event.color, event.row.motifs.includes('mat') ? 2.2 : 1.2, random)
    }
  }

  const figures = []
  for (const event of events) {
    if (event.type === 'move') {
      figures.push({
        y: event.end.y,
        draw() {
          const echoCount = event.style.scale > 1.05 ? 2 : 1
          for (let i = 0; i < echoCount; i += 1) {
            const ratio = i / Math.max(1, echoCount)
            const ex = event.start.x + (event.end.x - event.start.x) * ratio * 0.8
            const ey = event.start.y + (event.end.y - event.start.y) * ratio * 0.8
            ctx.save()
            ctx.globalAlpha = 0.28 - i * 0.08
            drawPieceFigure(ctx, event.row.piece, ex, ey, event.scale * (0.72 - i * 0.12), event.color, 'active')
            ctx.restore()
          }
          const finalScale = event.scale * (event.row.motifs.includes('mat') ? 1.28 : 1)
          const finalState = event.state === 'heroic' ? 'active' : event.state
          drawPieceFigure(ctx, event.row.piece, event.end.x, event.end.y, finalScale, event.color, finalState)
        },
      })
    } else {
      figures.push({
        y: event.point.y + 12,
        draw() {
          drawPieceFigure(ctx, event.piece, event.point.x, event.point.y, 0.72, event.color, 'fallen')
          drawExchangeMotif(ctx, event.point, event.color, event.balanced)
        },
      })
    }
  }

  figures.sort((a, b) => a.y - b.y)
  figures.forEach((figure) => figure.draw())

  ctx.save()
  ctx.strokeStyle = withAlpha(profile.accents[0], 0.18)
  ctx.lineWidth = 1.2
  ctx.setLineDash([6, 14])
  for (let file = 0; file < 8; file += 1) {
    const a = squareToScene(String.fromCharCode(97 + file) + '1', camera)
    const b = squareToScene(String.fromCharCode(97 + file) + '8', camera)
    ctx.beginPath(); ctx.moveTo(a.x, a.y + 18); ctx.lineTo(b.x, b.y - 36); ctx.stroke()
  }
  for (let rank = 1; rank <= 8; rank += 1) {
    const a = squareToScene(`a${rank}`, camera)
    const b = squareToScene(`h${rank}`, camera)
    ctx.beginPath(); ctx.moveTo(a.x, a.y + 18); ctx.lineTo(b.x, b.y + 18); ctx.stroke()
  }
  ctx.restore()

  drawCommentCartouche(ctx, analysis, profile)

  ctx.save()
  const glaze = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  glaze.addColorStop(0, 'rgba(255,255,255,0.05)')
  glaze.addColorStop(0.5, 'rgba(255,255,255,0.01)')
  glaze.addColorStop(1, 'rgba(0,0,0,0.1)')
  ctx.fillStyle = glaze
  ctx.globalAlpha = 0.32
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.restore()
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
