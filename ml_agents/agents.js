const prudens = require("../prudens_v0833/prudens");
const parsers = require("../prudens_v0833/parsers");

function randomMove(LEGAL_MOVES, N_ROWS = 8, N_COLS = 8) {
    if (LEGAL_MOVES.length === 0) {
        return undefined;
    }
	// console.log("White LM:", LEGAL_MOVES);
	return LEGAL_MOVES[Math.floor(LEGAL_MOVES.length * Math.random())];
}

function prudensMove(LEGAL_MOVES, BOARD, OTHELLO_POLICY, N_ROWS = 8, N_COLS = 8) {
	// console.log("Prudens LM:", LEGAL_MOVES);
    if (LEGAL_MOVES.length === 0) {
        return undefined;
    }
    const contextString = extractContext(BOARD, N_ROWS, N_COLS, LEGAL_MOVES);
    const context = parsers.parseContext(contextString)["context"];
    const output = prudens.forwardChaining(OTHELLO_POLICY, context);
	// console.log("Prudens Output:", output);
	const graph = output["graph"];
	const suggestedMoves = [];
	for (const literal of Object.keys(graph)) {
		if (literal.trim().substring(0, 5) === "move(") {
			suggestedMoves.push(literal.trim());
		}
	}
	// console.log("Sug:", suggestedMoves);
	if (suggestedMoves.length === 0) {
		return randomMove(LEGAL_MOVES, N_ROWS, N_COLS);
	}
	const moveLiteral = suggestedMoves[Math.floor(suggestedMoves.length * Math.random())].trim();
    // console.log("moveLiteral:", moveLiteral);
	const coords = moveLiteral.substring(5, moveLiteral.length - 1).split(",");
	const row = coords[0].trim();
	const col = coords[1].trim();
	// console.log([row, col]);
	// if (!LEGAL_MOVES.includes([row, col])) { // Need to throw exception at this point.
    //     console.log("Not legal:", LEGAL_MOVES, row, col);
	// 	return undefined;
	// }
    return [row, col];
}

function extractContext(BOARD, N_ROWS, N_COLS, LEGAL_MOVES) { // Convert an othello board to a Prudens context.
	let contextString = "";
	for (let row = 0; row < N_ROWS; row++) {
		for (let col = 0; col < N_COLS; col++) {
			contextString += "cell(" + row + "," + col + "," + BOARD[row][col] + ");";
		}
	}
    for (const coords of LEGAL_MOVES) {
        contextString += "legalMove(" + coords[0] + "," + coords[1] + ");";
    }
	return contextString;
}

module.exports = {
    randomMove,
    prudensMove,
}