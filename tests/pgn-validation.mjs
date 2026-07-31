import assert from 'node:assert/strict'
import { normalizePgn, parsePgn, trackPieces } from '../src/chess-analysis.js'

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

const tracked = trackPieces(parsed.moves)
assert.equal(tracked.pieces.length, 32)
assert.equal(tracked.rowPieceIds.length, 53)
const matingPiece = tracked.pieces.find((piece) => piece.id === tracked.rowPieceIds.at(-1))
assert.equal(matingPiece.finalSquare, 'a8')
assert.equal(matingPiece.participatedInMate, true)

console.log('Suivi individuel validé : 32 pièces, trajectoires, captures et pièce de mat conservées.')

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

const chessComWrappedPgn = `1. e4 e5 2. Nf3 Qf6 3. Nc3 Na6 4. d4 exd4 5. Nxd4 Nb4 6. Nf3 Qc6 7. a3 Na6 8.
Bd3 Qg6 9. O-O Qg4 10. Re1 Nc5 11. Nd5 c6 12. Nc7+ Kd8 13. Nxa8 Nxd3 14. Qxd3
Qe6 15. Ng5 Qe7 16. Qf3 h6 17. Nxf7+ Qxf7 18. Qxf7 Ne7 19. Bf4 d6 20. e5 dxe5
21. Rxe5 g5 22. Bd2 b6 23. Rae1 Bd7 24. Rxe7 Bxe7 25. Qxe7+ Kc8 26. Qd6 Kb7 27.
Qc7+ Kxa8 28. Qxd7 Rg8 29. Re8+ Rxe8 30. Qxe8+ Kb7 31. Qd7+ Kb8 32. f4 c5 33.
fxg5 hxg5 34. h4 a5 35. hxg5 Ka8 36. Bf4 a4 37. Qc7 b5 38. Qb8# 1-0`

const chessComParsed = parsePgn(chessComWrappedPgn)
assert.equal(chessComParsed.halfMoveCount, 75)
assert.equal(chessComParsed.displayedMoveCount, 38)
assert.equal(chessComParsed.result, '1-0')
assert.equal(chessComParsed.moves.at(-1).san, 'Qb8#')

console.log('PGN Chess.com sur plusieurs lignes reconnu : 75 demi-coups, résultat 1-0.')
