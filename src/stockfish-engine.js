const DEFAULT_TIMEOUT = 90_000

function scoreToWhitePerspective(score, fen) {
  const activeColor = fen.split(' ')[1]
  let sideToMoveScore = 0

  if (score?.type === 'mate') {
    const sign = Math.sign(score.value || 0)
    sideToMoveScore = sign * (100_000 - Math.min(Math.abs(score.value), 99) * 500)
  } else {
    sideToMoveScore = score?.value ?? 0
  }

  return activeColor === 'w' ? sideToMoveScore : -sideToMoveScore
}

function parseInfoLine(line) {
  if (!line.startsWith('info ')) return null

  const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)/)
  if (!scoreMatch) return null

  const depthMatch = line.match(/\bdepth\s+(\d+)/)
  const pvMatch = line.match(/\bpv\s+(.+)$/)

  return {
    depth: depthMatch ? Number(depthMatch[1]) : 0,
    score: {
      type: scoreMatch[1],
      value: Number(scoreMatch[2]),
    },
    pv: pvMatch ? pvMatch[1].trim().split(/\s+/) : [],
  }
}

export class StockfishEngine {
  constructor() {
    this.worker = null
    this.waiters = new Set()
    this.currentSearch = null
    this.initialized = false
  }

  async init() {
    if (this.initialized) return

    const engineUrl = `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`
    this.worker = new Worker(engineUrl)

    this.worker.addEventListener('message', (event) => {
      const payload = String(event.data ?? '')
      for (const line of payload.split(/\r?\n/).filter(Boolean)) {
        this.#handleLine(line)
      }
    })

    this.worker.addEventListener('error', (event) => {
      const error = new Error(
        `Le moteur Stockfish n’a pas pu démarrer : ${event.message || 'erreur inconnue'}`,
      )
      this.#rejectAll(error)
    })

    this.#send('uci')
    await this.#waitFor((line) => line === 'uciok')
    this.#send('setoption name Hash value 16')
    this.#send('setoption name MultiPV value 1')
    this.#send('isready')
    await this.#waitFor((line) => line === 'readyok')
    this.initialized = true
  }

  async analyzeFen(fen, depth = 10, signal) {
    await this.init()

    if (signal?.aborted) throw new DOMException('Analyse interrompue', 'AbortError')
    if (this.currentSearch) {
      throw new Error('Une autre position est déjà en cours d’analyse.')
    }

    this.#send(`position fen ${fen}`)
    this.#send(`go depth ${depth}`)

    return new Promise((resolve, reject) => {
      let latest = null
      const timeout = window.setTimeout(() => {
        this.#send('stop')
        cleanup()
        reject(new Error('Stockfish a dépassé le temps maximal pour cette position.'))
      }, DEFAULT_TIMEOUT)

      const abort = () => {
        this.#send('stop')
        cleanup()
        reject(new DOMException('Analyse interrompue', 'AbortError'))
      }

      const cleanup = () => {
        window.clearTimeout(timeout)
        signal?.removeEventListener('abort', abort)
        this.currentSearch = null
      }

      signal?.addEventListener('abort', abort, { once: true })

      this.currentSearch = (line) => {
        const info = parseInfoLine(line)
        if (info) latest = info

        if (!line.startsWith('bestmove')) return

        const bestMove = line.split(/\s+/)[1]
        const result = {
          fen,
          depth: latest?.depth ?? depth,
          score: latest?.score ?? { type: 'cp', value: 0 },
          scoreWhite: scoreToWhitePerspective(latest?.score, fen),
          bestMove: bestMove && bestMove !== '(none)' ? bestMove : null,
          principalVariation: latest?.pv ?? [],
        }
        cleanup()
        resolve(result)
      }
    })
  }

  stop() {
    this.#send('stop')
  }

  destroy() {
    this.worker?.terminate()
    this.worker = null
    this.initialized = false
    this.waiters.clear()
    this.currentSearch = null
  }

  #send(command) {
    this.worker?.postMessage(command)
  }

  #handleLine(line) {
    this.currentSearch?.(line)

    for (const waiter of [...this.waiters]) {
      if (!waiter.predicate(line)) continue
      window.clearTimeout(waiter.timeout)
      this.waiters.delete(waiter)
      waiter.resolve(line)
    }
  }

  #waitFor(predicate, timeoutMs = DEFAULT_TIMEOUT) {
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timeout: window.setTimeout(() => {
          this.waiters.delete(waiter)
          reject(new Error('Le moteur Stockfish ne répond pas.'))
        }, timeoutMs),
      }
      this.waiters.add(waiter)
    })
  }

  #rejectAll(error) {
    for (const waiter of this.waiters) {
      window.clearTimeout(waiter.timeout)
      waiter.reject(error)
    }
    this.waiters.clear()
  }
}
