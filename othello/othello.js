// let BOARD; // 0 = empty, 1 = white, -1 = black.
// let LEGAL_MOVES; // String array, containing all cell ids that are legal moves.
// let TO_BE_FLIPPED; // List of cell ids that should be flipped.
// let LAST_MOVE;
// let ALL_DIRECTIONS = [
//     [1, -1], [1, 0], [1, 1],
//     [0, -1], [0, 1],
//     [-1, -1], [-1, 0], [-1, 1],
// ];
// let PLAYING = true;
// let EMPTY_CELLS;
// let NO_LEGAL_MOVES = false;

function initializeBoard(BOARD, LEGAL_MOVES, ALL_DIRECTIONS, TO_BE_FLIPPED, N_ROWS, N_COLS) {
    const EMPTY_CELLS = N_ROWS * N_COLS - 4;
    BOARD = new Array(N_ROWS);
    for (let i=0; i < N_ROWS; i++) {
        BOARD[i] = [];
        for (let j=0; j < N_COLS; j++) {
            BOARD[i].push(0);
        }
    }
    BOARD = setUpPosition(BOARD, N_ROWS, N_COLS);
    const legalOutput = calculateLegalMoves(BOARD, LEGAL_MOVES, TO_BE_FLIPPED, ALL_DIRECTIONS, 1, N_ROWS, N_COLS);
    // console.log(legalOutput);
    return {
        BOARD: BOARD,
        LEGAL_MOVES: legalOutput["LEGAL_MOVES"],
        TO_BE_FLIPPED: legalOutput["TO_BE_FLIPPED"],
        EMPTY_CELLS: EMPTY_CELLS,
    };
}

function flipPieces(BOARD, LAST_MOVE, TO_BE_FLIPPED) {
    // console.log("TO_BE_FLIPPED:", TO_BE_FLIPPED);
    // console.log("Last move:", LAST_MOVE);
    // console.log("What?", TO_BE_FLIPPED.get(arrayHash(LAST_MOVE)));
    let coords, row, col;
    for (const coords of TO_BE_FLIPPED.get(arrayHash(LAST_MOVE))) {
        row = coords[0];
        col = coords[1];
        if (BOARD[row][col] === -1) {
            BOARD[row][col] = 1;
        } else {
            BOARD[row][col] = -1;
        }
    }
    return BOARD;
}

function setUpPosition(BOARD, N_ROWS, N_COLS) {
    let xc1, xc2, yc1, yc2;
    if (N_ROWS % 2 === 0) {
        xc1 = N_ROWS / 2 - 1;
        xc2 = xc1 + 1;
    } else {
        xc1 = (N_ROWS - 1) / 2;
        xc2 = xc1 + 1;
    }
    if (N_COLS % 2 === 0) {
        yc1 = N_COLS / 2 - 1;
        yc2 = yc1 + 1;
    } else {
        yc1 = (N_COLS - 1) / 2;
        yc2 = yc1 + 1;
    }
    BOARD[xc1][yc1] = 1;
    BOARD[xc1][yc2] = -1;
    BOARD[xc2][yc1] = -1;
    BOARD[xc2][yc2] = 1;
    return BOARD;
}

function calculateLegalMoves(BOARD, LEGAL_MOVES, TO_BE_FLIPPED, ALL_DIRECTIONS, opponent = 1, N_ROWS, N_COLS) {
    LEGAL_MOVES = [];
    TO_BE_FLIPPED = new Map();
    let toBeFlipped;
    for (let i = 0; i < N_ROWS; i++) {
        for (let j = 0; j < N_COLS; j++) {
            toBeFlipped = [];
            for (const direction of ALL_DIRECTIONS) {
                toBeFlipped.push(...isLegalMoveInDirection(BOARD, [i, j], direction[0], direction[1], opponent, N_ROWS, N_COLS));
            }
            if (toBeFlipped.length !== 0) {
                LEGAL_MOVES.push([i, j]);
                TO_BE_FLIPPED.set(arrayHash([i, j]), toBeFlipped);
            }
        }
    }
    return {
        LEGAL_MOVES: LEGAL_MOVES,
        TO_BE_FLIPPED: TO_BE_FLIPPED,
    };
}

function isLegalMoveInDirection(BOARD, coords, xStep, yStep, opponent = 1, N_ROWS, N_COLS) {
    const cellX = coords[0];
    const cellY = coords[1];
    const opponentCells = [];
    if (BOARD[cellX][cellY] !== 0) {
        return [];
    }
    let currentX = cellX + xStep, currentY = cellY + yStep, isPreviousWhite = false;
    while (currentX < N_ROWS && currentX >= 0 && currentY < N_COLS && currentY >= 0 && BOARD[currentX][currentY] !== 0) {
        if (isPreviousWhite && BOARD[currentX][currentY] === -opponent) {
            return opponentCells;
        }
        if (!isPreviousWhite) {
            if (BOARD[currentX][currentY] === -opponent) {
                return [];
            }
            isPreviousWhite = true;
        }
        opponentCells.push([currentX, currentY]);
        currentX += xStep;
        currentY += yStep;
    }
    return [];
}

function updateScore(TO_BE_FLIPPED, LAST_MOVE, color, previousScore) {
    const flipped = TO_BE_FLIPPED.get(arrayHash(LAST_MOVE)).length;
    const oldBlacks = previousScore[0];
    const oldWhites = previousScore[1];
    const score = [];
    if (color === 1) {
        score[0] = oldBlacks - flipped;
        score[1] = oldWhites + flipped + 1;
    } else {
        score[0] = oldBlacks + flipped + 1;
        score[1] = oldWhites - flipped;
    }
    return score;
}

function makeSingleMove(BOARD, LEGAL_MOVES, EMPTY_CELLS, TO_BE_FLIPPED, ALL_DIRECTIONS, previousScore, row, col, color = -1, N_ROWS, N_COLS) {
    BOARD[row][col] = color;
    flipPieces(BOARD, [row, col], TO_BE_FLIPPED);
    let score = updateScore(TO_BE_FLIPPED, [row, col], color, previousScore);
    const legalOutput = calculateLegalMoves(BOARD, LEGAL_MOVES, TO_BE_FLIPPED, ALL_DIRECTIONS, color, N_ROWS, N_COLS);
    EMPTY_CELLS -= 1;
    return {
        score: score,
        LEGAL_MOVES: legalOutput["LEGAL_MOVES"],
        TO_BE_FLIPPED: legalOutput["TO_BE_FLIPPED"],
        BOARD: BOARD,
        EMPTY_CELLS: EMPTY_CELLS,
    };
}

function arrayHash(array) {
    return array.join("_");
}

module.exports = {
    initializeBoard,
    calculateLegalMoves,
    flipPieces,
    makeSingleMove,
}