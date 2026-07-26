import assert from 'node:assert/strict'
import { normalizePgn, parsePgn } from '../src/chess-analysis.js'

const pastedPgn = `1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. e5 h6 7. exf6 Qxf6 8.
Nc3 Qe6+ 9. Be3 Bd6 10. Bd3 Ba6 11. Bxa6 f6 12. Qd2 Bf8 13. O-O-O Rd8 14. Rde1
Be7 15. Bc5 Bxc5 16. Rxe6+ dxe6 17. Qe2 Bxf2 18. Qxf2 h5 19. Qe2 Rd4 20. Rd1
Rxd1+ 21. Kxd1 Kd7 22. Bc4 Ke7 23. Qxe6+ Kd8 24. Qxc6 Rh7 25. Be6 g5 26. Nd5 a5
27. Qa8# 1-0`

const parsed = parsePgn(pastedPgn)
assert.equal(parsed.halfMoveCount, 53)
assert.equal(parsed.displayedMoveCount, 27)
assert.equal(parsed.result, '1-0')
assert.equal(parsed.moves.at(-1).san, 'Qa8#')

console.log('PGN collé reconnu : 53 demi-coups, résultat 1-0, mat par Qa8#.')

const aggressivelyWrappedPgn = `1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. e5 h6 7. exf6 Qxf6 8.

Nc3	Qe6+ 9. Be3 Bd6 10. Bd3 Ba6 11. Bxa6 f6 12. Qd2 Bf8 13. O-O-O Rd8 14. Rde1
Be7 15. Bc5 Bxc5 16. Rxe6+ dxe6 17. Qe2 Bxf2 18. Qxf2 h5 19. Qe2 Rd4 20. Rd1
Rxd1+ 21. Kxd1 Kd7 22. Bc4 Ke7 23. Qxe6+ Kd8 24. Qxc6 Rh7 25. Be6 g5 26. Nd5 a5
27. Qa8# 1-0`

const normalized = normalizePgn(aggressivelyWrappedPgn)
assert.equal(normalized.includes('\n'), false, 'Un PGN sans en-têtes doit être remis sur une seule ligne.')
const wrappedParsed = parsePgn(aggressivelyWrappedPgn)
assert.equal(wrappedParsed.halfMoveCount, 53)
assert.equal(wrappedParsed.moves.at(-1).san, 'Qa8#')

console.log('Retours à la ligne et espaces multiples normalisés avec succès.')
