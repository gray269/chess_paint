const SIZE = 1400
const PADDING = 84
const HORIZON = 520

const PIECE_VALUES = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 20 }

const BASE_PIECE_COLORS = {
  p: '#d7b072',
  n: '#8db86c',
  b: '#73b7b9',
  r: '#7190d6',
  q: '#bf76a8',
  k: '#f0dea1',
}

const SCENE_PROFILES = {
  'mythic-antique': {
    sky: ['#f4d8af', '#da9774', '#65567a'],
    ground: ['#8c7868', '#443630'],
    accents: ['#ffedc0', '#d98b63', '#86b0bf'],
    light: '#fff3d7',
    atmosphere: 'gold',
    environment: 'temple',
  },
  'romantic-storm': {
    sky: ['#f0bf9c', '#a16a78', '#29324a'],
    ground: ['#665149', '#29222c'],
    accents: ['#fbe6bf', '#d77b75', '#8eb6d9'],
    light: '#fff6d2',
    atmosphere: 'storm',
    environment: 'cliff',
  },
  'alpine-calm': {
    sky: ['#dde8ef', '#99bec8', '#60748c'],
    ground: ['#79896f', '#45504b'],
    accents: ['#f0e7d3', '#9fbfaf', '#c9a26a'],
    light: '#ffffff',
    atmosphere: 'mist',
    environment: 'mountain',
  },
  'maritime-odyssey': {
    sky: ['#dabb97', '#60a2bf', '#244266'],
    ground: ['#4c676c', '#243742'],
    accents: ['#f7e0b5', '#80d7d1', '#5975d0'],
    light: '#fff4d6',
    atmosphere: 'marine',
    environment: 'ocean',
  },
  'desert-epic': {
    sky: ['#f1d39d', '#d69266', '#744d62'],
    ground: ['#a5835b', '#5d4334'],
    accents: ['#fff0c8', '#ea9a55', '#c45d57'],
    light: '#fff2d0',
    atmosphere: 'dust',
    environment: 'desert',
  },
  'forest-legend': {
    sky: ['#d8dbbc', '#7b9a82', '#31433d'],
    ground: ['#58694a', '#263328'],
    accents: ['#eef0d7', '#8ec39d', '#6d93b6'],
    light: '#f7f6e9',
    atmosphere: 'forest',
    environment: 'forest',
  },
  'courtly-renaissance': {
    sky: ['#f1dfca', '#d1a58f', '#786878'],
    ground: ['#81836d', '#49403e'],
    accents: ['#fff0d4', '#d27795', '#8ea7ca'],
    light: '#fff7e2',
    atmosphere: 'court',
    environment: 'garden',
  },
  'lunar-dream': {
    sky: ['#ddd9f1', '#7288b4', '#262a44'],
    ground: ['#55607a', '#252a3b'],
    accents: ['#fff5d7', '#b5a0eb', '#94ccd8'],
    light: '#f8f8ff',
    atmosphere: 'night',
    environment: 'lake',
  },
}

const TITLE_PATTERNS = [
  '{title}',
  '{title} — {scene}',
  '{title}',
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const bigint = Number.parseInt(value, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
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
    s: clamp(hsl.s * 0.95 + 0.01, 0, 1),
    l: clamp(0.55 - (hsl.l - 0.5) * 0.18, 0.18, 0.82),
  }))
}

function mixColors(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return rgbToHex({
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight,
  })
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function sceneProfile(analysis) {
  return SCENE_PROFILES[analysis.scene?.id] || SCENE_PROFILES['mythic-antique']
}

function pieceColor(piece, color, index, random) {
  const base = BASE_PIECE_COLORS[piece] || '#ffffff'
  const source = color === 'w' ? base : complementColor(base)
  return adjustColor(source, {
    hueShift: (index % 5 - 2) * 2 + (random() - 0.5) * 3,
    lightness: color === 'w' ? (random() - 0.5) * 0.03 : -0.05 + (random() - 0.5) * 0.03,
  })
}

function squareAnchor(square, seedOffset = 0) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const fx = (file + 0.5) / 8
  const fy = 1 - (rank + 0.5) / 8
  const x = PADDING + fx * (SIZE - PADDING * 2)
  const y = 270 + fy * 700 + Math.abs(fx - 0.5) * 70
  const skew = (fy - 0.5) * 110
  return { x: x + skew * 0.55 + seedOffset, y }
}

function warpedAnchor(square, random, wave = 1) {
  const base = squareAnchor(square)
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const jitterX = (Math.sin((file + 1) * 0.9 + (rank + 1) * 0.7) * 18 + (random() - 0.5) * 18) * wave
  const jitterY = (Math.cos((file + 1) * 0.55 + (rank + 1) * 0.82) * 16 + (random() - 0.5) * 14) * wave
  return { x: base.x + jitterX, y: base.y + jitterY }
}

function drawSkyAndLand(ctx, profile, random) {
  const sky = ctx.createLinearGradient(0, 0, 0, SIZE)
  sky.addColorStop(0, profile.sky[0])
  sky.addColorStop(0.45, profile.sky[1])
  sky.addColorStop(1, profile.sky[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, SIZE, SIZE)

  const halo = ctx.createRadialGradient(SIZE * 0.22, 180, 25, SIZE * 0.22, 180, 220)
  halo.addColorStop(0, withAlpha(profile.light, 0.85))
  halo.addColorStop(0.42, withAlpha(profile.light, 0.15))
  halo.addColorStop(1, withAlpha(profile.light, 0))
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, SIZE, SIZE)

  drawEnvironment(ctx, profile, random)

  ctx.save()
  ctx.fillStyle = withAlpha(profile.ground[0], 0.82)
  ctx.beginPath()
  ctx.moveTo(0, HORIZON)
  ctx.bezierCurveTo(SIZE * 0.18, HORIZON - 30, SIZE * 0.42, HORIZON + 22, SIZE * 0.58, HORIZON - 20)
  ctx.bezierCurveTo(SIZE * 0.72, HORIZON - 55, SIZE * 0.85, HORIZON + 18, SIZE, HORIZON - 12)
  ctx.lineTo(SIZE, SIZE)
  ctx.lineTo(0, SIZE)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  drawAtmosphericWashes(ctx, profile, random)
  drawCanvasGrain(ctx, profile, random)
}

function drawEnvironment(ctx, profile, random) {
  ctx.save()
  switch (profile.environment) {
    case 'temple': {
      for (let i = 0; i < 7; i += 1) {
        const x = 90 + i * 175 + random() * 20
        const y = HORIZON - 40 - random() * 28
        ctx.fillStyle = withAlpha(profile.accents[0], 0.08)
        ctx.fillRect(x, y, 28, 250)
        ctx.strokeStyle = withAlpha(profile.ground[1], 0.17)
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, 28, 250)
      }
      break
    }
    case 'cliff': {
      ctx.fillStyle = withAlpha(profile.ground[1], 0.54)
      ctx.beginPath()
      ctx.moveTo(0, HORIZON + 90)
      ctx.lineTo(0, 320)
      ctx.lineTo(180, 450)
      ctx.lineTo(245, HORIZON + 110)
      ctx.closePath()
      ctx.fill()
      for (let i = 0; i < 16; i += 1) {
        ctx.strokeStyle = withAlpha(profile.accents[2], 0.1)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, HORIZON + 110 + i * 12)
        ctx.bezierCurveTo(220, HORIZON + 76 + i * 10, 980, HORIZON + 130 + i * 8, SIZE, HORIZON + 112 + i * 12)
        ctx.stroke()
      }
      break
    }
    case 'mountain': {
      for (let i = 0; i < 5; i += 1) {
        ctx.fillStyle = withAlpha(i % 2 ? profile.sky[2] : profile.ground[0], 0.24 - i * 0.03)
        ctx.beginPath()
        ctx.moveTo(-60 + i * 290, HORIZON + 20)
        ctx.lineTo(130 + i * 280, 270 + random() * 150)
        ctx.lineTo(340 + i * 285, HORIZON + 20)
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'ocean': {
      ctx.fillStyle = withAlpha(profile.accents[2], 0.12)
      ctx.fillRect(0, HORIZON + 48, SIZE, 165)
      for (let i = 0; i < 18; i += 1) {
        ctx.strokeStyle = withAlpha(profile.accents[0], 0.09)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, HORIZON + 75 + i * 11)
        ctx.bezierCurveTo(190, HORIZON + 55 + i * 9, 1020, HORIZON + 125 + i * 7, SIZE, HORIZON + 82 + i * 11)
        ctx.stroke()
      }
      break
    }
    case 'desert': {
      for (let i = 0; i < 7; i += 1) {
        ctx.fillStyle = withAlpha(i % 2 ? profile.accents[0] : profile.ground[0], 0.12)
        ctx.beginPath()
        ctx.moveTo(-100, HORIZON + 150 + i * 28)
        ctx.bezierCurveTo(260, HORIZON + 110 + i * 10, 830, HORIZON + 215 + i * 18, SIZE + 80, HORIZON + 135 + i * 22)
        ctx.lineTo(SIZE + 80, SIZE)
        ctx.lineTo(-100, SIZE)
        ctx.closePath()
        ctx.fill()
      }
      break
    }
    case 'forest': {
      for (let i = 0; i < 16; i += 1) {
        const x = 35 + i * 88 + random() * 30
        ctx.strokeStyle = withAlpha(profile.ground[1], 0.22)
        ctx.lineWidth = 14 + random() * 10
        ctx.beginPath()
        ctx.moveTo(x, SIZE)
        ctx.lineTo(x + random() * 28 - 14, 240 + random() * 280)
        ctx.stroke()
      }
      break
    }
    case 'garden': {
      for (let i = 0; i < 6; i += 1) {
        const x = 140 + i * 180
        ctx.strokeStyle = withAlpha(profile.accents[0], 0.17)
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(x, HORIZON + 55, 70, Math.PI, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = withAlpha(profile.ground[0], 0.12)
        ctx.fillRect(x - 22, HORIZON + 55, 44, 150)
      }
      break
    }
    case 'lake': {
      ctx.fillStyle = withAlpha(profile.accents[2], 0.15)
      ctx.beginPath()
      ctx.ellipse(SIZE * 0.54, HORIZON + 126, 360, 84, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    default:
      break
  }
  ctx.restore()
}

function drawAtmosphericWashes(ctx, profile, random) {
  ctx.save()
  for (let i = 0; i < 40; i += 1) {
    const x = random() * SIZE
    const y = random() * SIZE
    const w = 120 + random() * 320
    const h = 80 + random() * 220
    ctx.fillStyle = withAlpha(choose(profile.accents, random), 0.035 + random() * 0.03)
    ctx.beginPath()
    ctx.ellipse(x, y, w, h, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawCanvasGrain(ctx, profile, random) {
  ctx.save()
  for (let i = 0; i < 2600; i += 1) {
    ctx.globalAlpha = 0.013 + random() * 0.018
    ctx.fillStyle = random() > 0.55 ? withAlpha(profile.accents[0], 0.15) : 'rgba(0,0,0,0.1)'
    ctx.save()
    ctx.translate(random() * SIZE, random() * SIZE)
    ctx.rotate((random() - 0.5) * 1.25)
    ctx.fillRect(-10 - random() * 22, -1.5 - random() * 3, 20 + random() * 44, 1 + random() * 4)
    ctx.restore()
  }
  ctx.restore()
}

function scoreRowImportance(row, index, total) {
  let score = 1
  score += row.cpLoss / 55
  if (row.motifs.includes('capture')) score += 2.2
  if (row.motifs.includes('échec')) score += 2.1
  if (row.motifs.includes('mat')) score += 8.5
  if (row.motifs.includes('promotion')) score += 4.8
  if (row.sacrifice) score += 3.8
  if (row.quality === 'best' || row.quality === 'brilliant') score += 1.5
  if (row.quality === 'mistake') score += 1.2
  if (row.quality === 'blunder') score += 2.4
  if (index > total * 0.72) score += 0.8
  if (index < total * 0.22) score += 0.25
  return score
}

function splitActs(rows) {
  const size = Math.max(1, Math.ceil(rows.length / 3))
  return [
    rows.slice(0, size),
    rows.slice(size, size * 2),
    rows.slice(size * 2),
  ]
}

function chooseKeyMoments(rows) {
  const scored = rows.map((row, index) => ({ row, score: scoreRowImportance(row, index, rows.length), index }))
  const acts = splitActs(scored)
  const selected = []
  for (const act of acts) {
    const sorted = [...act].sort((a, b) => b.score - a.score)
    selected.push(...sorted.slice(0, Math.min(2, sorted.length)))
  }
  selected.push(scored[0])
  selected.push(scored.at(-1))
  const deduped = []
  const seen = new Set()
  for (const item of selected.sort((a, b) => a.index - b.index)) {
    const key = `${item.index}-${item.row.san}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }
  return deduped.slice(0, 7)
}

function drawActWashes(ctx, analysis, profile, random) {
  const acts = splitActs(analysis.rows)
  const zones = [
    { x: SIZE * 0.18, y: SIZE * 0.53, w: 310, h: 500, rotation: -0.2 },
    { x: SIZE * 0.5, y: SIZE * 0.49, w: 360, h: 540, rotation: 0.04 },
    { x: SIZE * 0.82, y: SIZE * 0.53, w: 310, h: 500, rotation: 0.18 },
  ]

  acts.forEach((act, index) => {
    if (!act.length) return
    const checks = act.filter((row) => row.motifs.includes('échec') || row.motifs.includes('mat')).length
    const captures = act.filter((row) => row.motifs.includes('capture')).length
    const blunders = act.filter((row) => row.quality === 'blunder').length
    const energetic = checks + captures + blunders
    const intensity = clamp(0.18 + energetic / Math.max(act.length, 1) * 0.6, 0.16, 0.64)
    const zone = zones[index]
    const baseColor = mixColors(profile.accents[index % profile.accents.length], profile.ground[0], 0.35)
    ctx.save()
    ctx.translate(zone.x, zone.y)
    ctx.rotate(zone.rotation + (random() - 0.5) * 0.05)
    ctx.fillStyle = withAlpha(baseColor, 0.065 + intensity * 0.09)
    ctx.beginPath()
    ctx.ellipse(0, 0, zone.w, zone.h, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = withAlpha(profile.light, 0.05 + intensity * 0.06)
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(-zone.w * 0.65, -zone.h * 0.15)
    ctx.bezierCurveTo(-zone.w * 0.2, -zone.h * 0.42, zone.w * 0.18, zone.h * 0.35, zone.w * 0.7, zone.h * 0.06)
    ctx.stroke()
    ctx.restore()
  })
}

function drawMovementField(ctx, analysis, profile, random) {
  analysis.rows.forEach((row, index) => {
    const start = warpedAnchor(row.from, random, 0.72)
    const end = warpedAnchor(row.to, random, 0.72)
    const color = pieceColor(row.piece, row.color, index, random)
    const alphaBase = row.cpLoss > 180 ? 0.09 : row.motifs.includes('capture') ? 0.08 : 0.05
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.hypot(dx, dy)
    const nx = distance ? -dy / distance : 0
    const ny = distance ? dx / distance : 0
    const bend = (random() - 0.5) * (40 + distance * 0.08)
    const control = {
      x: start.x + dx * 0.5 + nx * bend,
      y: start.y + dy * 0.45 + ny * bend - 14,
    }
    ctx.save()
    ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.08 }), alphaBase * 0.75)
    ctx.lineWidth = 8 + (row.motifs.includes('capture') ? 1.5 : 0) + (row.quality === 'blunder' ? 2 : 0)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y)
    ctx.stroke()
    ctx.strokeStyle = withAlpha(color, alphaBase)
    ctx.lineWidth = 3 + (row.quality === 'best' || row.quality === 'brilliant' ? 2 : 0)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y)
    ctx.stroke()
    ctx.restore()
  })
}

function archetypeName(piece) {
  switch (piece) {
    case 'p': return 'soldier'
    case 'n': return 'rider'
    case 'b': return 'oracle'
    case 'r': return 'citadel'
    case 'q': return 'sovereign'
    case 'k': return 'monarch'
    default: return 'soldier'
  }
}

function drawSilhouette(ctx, type, x, y, scale, color, mode = 'standing') {
  ctx.save()
  ctx.translate(x, y)
  if (mode === 'fallen') ctx.rotate(type === 'citadel' ? -0.35 : -0.85)
  if (mode === 'ascending') ctx.translate(0, -10 * scale)

  ctx.fillStyle = withAlpha(color, 0.84)
  ctx.strokeStyle = withAlpha(adjustColor(color, { lightness: -0.2 }), 0.42)
  ctx.lineWidth = 2.2 * scale

  const shadowScale = mode === 'fallen' ? 0.8 : 1
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  ctx.beginPath()
  ctx.ellipse(0, 22 * scale, 22 * scale * shadowScale, 8 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  switch (type) {
    case 'soldier': {
      ctx.beginPath(); ctx.arc(0, -32 * scale, 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -22 * scale); ctx.lineTo(0, 8 * scale); ctx.lineTo(-12 * scale, 28 * scale); ctx.moveTo(0, 8 * scale); ctx.lineTo(12 * scale, 28 * scale); ctx.moveTo(-12 * scale, -6 * scale); ctx.lineTo(10 * scale, -12 * scale); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8 * scale, -10 * scale); ctx.lineTo(20 * scale, -28 * scale); ctx.stroke();
      break
    }
    case 'rider': {
      ctx.beginPath(); ctx.ellipse(-8 * scale, 10 * scale, 20 * scale, 11 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-16 * scale, 4 * scale); ctx.lineTo(-30 * scale, -15 * scale); ctx.lineTo(-8 * scale, -30 * scale); ctx.quadraticCurveTo(16 * scale, -18 * scale, 14 * scale, 2 * scale); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-4 * scale, -38 * scale, 7 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4 * scale, -31 * scale); ctx.lineTo(-4 * scale, -10 * scale); ctx.lineTo(16 * scale, 8 * scale); ctx.moveTo(-18 * scale, 18 * scale); ctx.lineTo(-25 * scale, 33 * scale); ctx.moveTo(-3 * scale, 18 * scale); ctx.lineTo(-6 * scale, 34 * scale); ctx.moveTo(8 * scale, 12 * scale); ctx.lineTo(4 * scale, 32 * scale); ctx.stroke();
      break
    }
    case 'oracle': {
      ctx.beginPath(); ctx.moveTo(0, -46 * scale); ctx.quadraticCurveTo(22 * scale, -16 * scale, 16 * scale, 18 * scale); ctx.lineTo(-16 * scale, 18 * scale); ctx.quadraticCurveTo(-22 * scale, -16 * scale, 0, -46 * scale); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -21 * scale, 10 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -42 * scale); ctx.lineTo(0, -14 * scale); ctx.moveTo(-5 * scale, -28 * scale); ctx.lineTo(5 * scale, -28 * scale); ctx.stroke();
      break
    }
    case 'citadel': {
      ctx.fillRect(-20 * scale, -42 * scale, 40 * scale, 54 * scale)
      ctx.strokeRect(-20 * scale, -42 * scale, 40 * scale, 54 * scale)
      ctx.fillRect(-24 * scale, 12 * scale, 48 * scale, 10 * scale)
      ctx.strokeRect(-24 * scale, 12 * scale, 48 * scale, 10 * scale)
      ctx.clearRect(-14 * scale, -42 * scale, 8 * scale, 9 * scale)
      ctx.clearRect(-4 * scale, -42 * scale, 8 * scale, 9 * scale)
      ctx.clearRect(6 * scale, -42 * scale, 8 * scale, 9 * scale)
      break
    }
    case 'sovereign': {
      ctx.beginPath(); ctx.moveTo(-22 * scale, 20 * scale); ctx.lineTo(-12 * scale, -14 * scale); ctx.lineTo(-2 * scale, -6 * scale); ctx.lineTo(0, -34 * scale); ctx.lineTo(5 * scale, -6 * scale); ctx.lineTo(14 * scale, -14 * scale); ctx.lineTo(22 * scale, 20 * scale); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-14 * scale, -20 * scale, 4 * scale, 0, Math.PI * 2); ctx.arc(0, -38 * scale, 4.5 * scale, 0, Math.PI * 2); ctx.arc(14 * scale, -20 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-22 * scale, 20 * scale); ctx.lineTo(22 * scale, 20 * scale); ctx.lineTo(18 * scale, 30 * scale); ctx.lineTo(-18 * scale, 30 * scale); ctx.closePath(); ctx.fill();
      break
    }
    case 'monarch':
    default: {
      ctx.beginPath(); ctx.moveTo(-18 * scale, 20 * scale); ctx.lineTo(-10 * scale, -12 * scale); ctx.lineTo(10 * scale, -12 * scale); ctx.lineTo(18 * scale, 20 * scale); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -20 * scale, 11 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -44 * scale); ctx.lineTo(0, -10 * scale); ctx.moveTo(-10 * scale, -28 * scale); ctx.lineTo(10 * scale, -28 * scale); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-22 * scale, 20 * scale); ctx.lineTo(22 * scale, 20 * scale); ctx.lineTo(18 * scale, 30 * scale); ctx.lineTo(-18 * scale, 30 * scale); ctx.closePath(); ctx.fill();
      break
    }
  }
  ctx.restore()
}

function drawCaptureRemnant(ctx, piece, x, y, scale, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = withAlpha(color, 0.28)
  ctx.strokeStyle = withAlpha(color, 0.34)
  ctx.lineWidth = 1.5 * scale
  switch (piece) {
    case 'q':
      ctx.beginPath(); ctx.moveTo(-18 * scale, 10 * scale); ctx.lineTo(-8 * scale, -8 * scale); ctx.lineTo(0, -2 * scale); ctx.lineTo(8 * scale, -8 * scale); ctx.lineTo(18 * scale, 10 * scale); ctx.lineTo(0, 18 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
      break
    case 'k':
      ctx.beginPath(); ctx.moveTo(-16 * scale, 4 * scale); ctx.lineTo(16 * scale, -4 * scale); ctx.moveTo(-6 * scale, -16 * scale); ctx.lineTo(6 * scale, 16 * scale); ctx.stroke();
      break
    case 'r':
      ctx.fillRect(-16 * scale, -12 * scale, 32 * scale, 22 * scale); ctx.strokeRect(-16 * scale, -12 * scale, 32 * scale, 22 * scale)
      break
    case 'n':
      ctx.beginPath(); ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-12 * scale, 0); ctx.lineTo(12 * scale, 0); ctx.stroke();
      break
    default:
      ctx.beginPath(); ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2); ctx.fill();
      break
  }
  ctx.restore()
}

function drawFocalAura(ctx, x, y, color, strength = 1) {
  const aura = ctx.createRadialGradient(x, y, 8, x, y, 150 * strength)
  aura.addColorStop(0, withAlpha(color, 0.55))
  aura.addColorStop(0.34, withAlpha(color, 0.16))
  aura.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = aura
  ctx.fillRect(x - 180 * strength, y - 180 * strength, 360 * strength, 360 * strength)
}

function drawResolutionLight(ctx, analysis, profile, random) {
  const last = analysis.rows.at(-1)
  if (!last) return
  const end = warpedAnchor(last.to, random, 0.3)
  const color = pieceColor(last.piece, last.color, analysis.rows.length, random)
  drawFocalAura(ctx, end.x, end.y - 24, color, last.motifs.includes('mat') ? 1.35 : 1)

  if (analysis.result !== '1/2-1/2') {
    const side = analysis.result === '1-0' ? 'w' : 'b'
    const beamColor = side === 'w' ? profile.light : mixColors(profile.accents[2], profile.ground[1], 0.3)
    ctx.save()
    const x = side === 'w' ? SIZE * 0.12 : SIZE * 0.88
    const gradient = ctx.createRadialGradient(x, 180, 20, x, 180, 320)
    gradient.addColorStop(0, withAlpha(beamColor, 0.22))
    gradient.addColorStop(1, withAlpha(beamColor, 0))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.restore()
  }
}

function drawNarrativeScene(ctx, analysis, profile, random) {
  const keyMoments = chooseKeyMoments(analysis.rows)
  const figures = []

  keyMoments.forEach(({ row, index }, order) => {
    const end = warpedAnchor(row.to, random, 0.55)
    const start = warpedAnchor(row.from, random, 0.55)
    const color = pieceColor(row.piece, row.color, index, random)
    const magnitude = row.color === 'w' ? analysis.players.white?.estimated || 1200 : analysis.players.black?.estimated || 1200
    const qualityScale = row.quality === 'brilliant' || row.quality === 'best' ? 1.18 : row.quality === 'blunder' ? 0.9 : 1
    const scale = clamp(0.8 + magnitude / 3200 + (scoreRowImportance(row, index, analysis.rows.length) / 18), 0.88, 1.48) * qualityScale
    const type = archetypeName(row.piece)
    const mode = row.motifs.includes('promotion') ? 'ascending' : 'standing'

    const trailColor = mixColors(color, profile.light, 0.18)
    ctx.save()
    ctx.strokeStyle = withAlpha(trailColor, 0.16)
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo((start.x + end.x) / 2, Math.min(start.y, end.y) - 40 - order * 3, end.x, end.y)
    ctx.stroke()
    ctx.restore()

    figures.push({
      y: end.y,
      draw() {
        drawFocalAura(ctx, end.x, end.y - 14, color, row.motifs.includes('mat') ? 1.08 : 0.8)
        drawSilhouette(ctx, type, end.x, end.y, scale, color, mode)
        if (row.motifs.includes('capture')) {
          const capturedColor = pieceColor(row.captured || 'p', row.color === 'w' ? 'b' : 'w', index + 10, random)
          drawCaptureRemnant(ctx, row.captured || 'p', end.x + 30 * scale, end.y + 22 * scale, 0.9 * scale, capturedColor)
        }
        if (row.motifs.includes('échec') || row.motifs.includes('mat')) {
          ctx.save()
          ctx.strokeStyle = withAlpha(profile.light, row.motifs.includes('mat') ? 0.5 : 0.26)
          ctx.lineWidth = row.motifs.includes('mat') ? 3.8 : 2.2
          const spikes = row.motifs.includes('mat') ? 10 : 6
          const outer = row.motifs.includes('mat') ? 72 * scale : 52 * scale
          for (let spike = 0; spike < spikes; spike += 1) {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * spike) / spikes
            ctx.beginPath()
            ctx.moveTo(end.x + Math.cos(angle) * 20 * scale, end.y - 20 * scale + Math.sin(angle) * 20 * scale)
            ctx.lineTo(end.x + Math.cos(angle) * outer, end.y - 20 * scale + Math.sin(angle) * outer)
            ctx.stroke()
          }
          ctx.restore()
        }
      },
    })
  })

  figures.sort((a, b) => a.y - b.y)
  figures.forEach((figure) => figure.draw())
}

function drawForegroundFragments(ctx, analysis, profile, random) {
  ctx.save()
  analysis.rows.forEach((row, index) => {
    if (!row.motifs.includes('capture') && row.quality !== 'blunder') return
    const end = warpedAnchor(row.to, random, 0.5)
    const color = pieceColor(row.piece, row.color, index, random)
    const count = row.quality === 'blunder' ? 9 : 5
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2
      const distance = 18 + random() * 45
      const x = end.x + Math.cos(angle) * distance
      const y = end.y + Math.sin(angle) * distance
      ctx.fillStyle = withAlpha(color, 0.12 + random() * 0.1)
      ctx.beginPath()
      ctx.ellipse(x, y, 4 + random() * 16, 2 + random() * 8, random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  ctx.restore()
}

function makeDisplayTitle(analysis, random) {
  const pattern = choose(TITLE_PATTERNS, random)
  return pattern
    .replace('{title}', analysis.artworkTitle || analysis.theme.label)
    .replace('{scene}', analysis.scene?.label || '')
    .trim()
}

function drawTitleOverlay(ctx, analysis, profile, random) {
  const title = makeDisplayTitle(analysis, random)
  ctx.save()
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 10
  ctx.fillStyle = withAlpha(profile.light, 0.92)
  ctx.font = '600 38px Georgia, serif'
  ctx.fillText(title, SIZE / 2, 72)
  ctx.shadowBlur = 0
  ctx.fillStyle = withAlpha(profile.light, 0.62)
  ctx.font = '18px Georgia, serif'
  const subtitle = `${analysis.scene?.label || ''} · ${analysis.theme.label}`
  ctx.fillText(subtitle, SIZE / 2, 104)
  ctx.restore()
}

function drawLowerCaption(ctx, analysis, profile) {
  ctx.save()
  ctx.fillStyle = 'rgba(20,18,24,0.18)'
  roundRect(ctx, 60, SIZE - 112, SIZE - 120, 56, 18)
  ctx.fill()
  ctx.fillStyle = withAlpha(profile.light, 0.76)
  ctx.font = '16px Georgia, serif'
  ctx.textAlign = 'center'
  const white = analysis.headers.White || 'Blancs'
  const black = analysis.headers.Black || 'Noirs'
  const caption = `${white} — ${black} · ${analysis.opening?.label || 'Ouverture libre'} · ${analysis.result}`
  ctx.fillText(caption, SIZE / 2, SIZE - 77)
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

function drawVarnish(ctx) {
  const glaze = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  glaze.addColorStop(0, 'rgba(255,255,255,0.05)')
  glaze.addColorStop(0.55, 'rgba(255,255,255,0.012)')
  glaze.addColorStop(1, 'rgba(0,0,0,0.12)')
  ctx.save()
  ctx.globalAlpha = 0.34
  ctx.fillStyle = glaze
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.restore()
}

export function renderPainting(canvas, analysis, sourcePgn) {
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  const seed = hashText(`${sourcePgn}|${analysis.artworkTitle || ''}|v1.0`)
  const random = randomGenerator(seed)
  const profile = sceneProfile(analysis)

  drawSkyAndLand(ctx, profile, random)
  drawActWashes(ctx, analysis, profile, random)
  drawMovementField(ctx, analysis, profile, random)
  drawResolutionLight(ctx, analysis, profile, random)
  drawNarrativeScene(ctx, analysis, profile, random)
  drawForegroundFragments(ctx, analysis, profile, random)
  drawTitleOverlay(ctx, analysis, profile, random)
  drawLowerCaption(ctx, analysis, profile)
  drawVarnish(ctx)
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
