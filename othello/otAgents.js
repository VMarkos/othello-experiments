function randomMove(color = -1) {
    if (LEGAL_MOVES.length === 0) {
        calculateLegalMoves(1);
        if (LEGAL_MOVES.length === 0) {
            return 1;
        }
    }
	let row, col;
	do {
		row = Math.floor(N_ROWS * Math.random());
		col = Math.floor(N_COLS * Math.random());
	} while (!LEGAL_MOVES.includes("oc-" + row + "-" + col));
	const cellId = "oc-" + row + "-" + col;
	updateLastMove(cellId);
	makeSingleMove(row, col, color);
	if (isGameOver()) {
		return 1;
	}
	return 0;
}

function prudensMove() { // Infers all legible moves according to the provided policy and then choses at random (this might need to be changed).
    if (LEGAL_MOVES.length === 0) {
        calculateLegalMoves(-1);
        if (LEGAL_MOVES.length === 0) {
            return 1;
        }
        return randomMove(1);
    }
	const inferences = otDeduce().split(";").filter(Boolean);
	const suggestedMoves = [];
	// console.log("inferences:", inferences);
	for (const literal of inferences) {
        // console.log(literal.trim().substring(0, 5));
		if (literal.trim().substring(0, 5) === "move(") {
			suggestedMoves.push(literal.trim());
		}
	}
    // console.log(suggestedMoves);
	if (suggestedMoves.length === 0) {
        randomMove();
		return randomMove(1);
	}
	const moveLiteral = suggestedMoves[Math.floor(suggestedMoves.length * Math.random())].trim();
    // console.log("moveLiteral:", moveLiteral);
	const coords = moveLiteral.substring(5, moveLiteral.length - 1).split(",");
	const row = coords[0].trim();
	const col = coords[1].trim();
	const cellId = "oc-" + row + "-" + col;
	updateLastMove(cellId);
	if (!LEGAL_MOVES.includes(cellId)) { // Need to throw exception at this point.
        // console.log("Not legal:", LEGAL_MOVES, cellId);
		return -1;
	}
	makeSingleMove(row, col);
    randomMove(1);
    console.log(isGameOver());
	if (isGameOver()) {
		return 1;
	}
	return 0;
}

function isGameOver() {
    console.log("EMPTY_CELLS:", EMPTY_CELLS);
    return EMPTY_CELLS === 0;
}

function updateLastMove(cellId) {
	// const cell = document.getElementById(cellId);
	if (LAST_MOVE) {
        const coords = LAST_MOVE.split("-");
        const row = coords[1];
        const col = coords[2];
        if (BOARD[row][col] === 1) {
            const previousCell = document.getElementById(LAST_MOVE);
            const previousPiece = previousCell.lastChild;
            // console.log(previousPiece);
            previousPiece.removeChild(previousPiece.lastChild);
        }
	}
	LAST_MOVE = cellId;
}

function extractContext() { // Convert an othello board to a Prudens context.
	let coords, contextString = "";
	for (let row = 0; row < N_ROWS; row++) {
		for (let col = 0; col < N_COLS; col++) {
			contextString += "cell(" + row + "," + col + "," + BOARD[row][col] + ");";
		}
	}
    for (const cellId of LEGAL_MOVES) {
        coords = cellId.split("-");
        contextString += "legalMove(" + coords[1] + "," + coords[2] + ");";
    }
	return contextString;
}

function makeSingleMove(row, col, color = -1) {
    eraseLegalMoves();
    const pieceClass = `othello-piece-${color === 1 ? "white" : "black"}`;
    const cell = document.getElementById("oc-" + row + "-" + col);
    const piece = document.createElement("div");
    if (color === 1) {
        const redDot = document.createElement("div");
        redDot.classList.add("othello-last-move");
        piece.append(redDot);
    }
    piece.classList.add(pieceClass);
    cell.append(piece);
    BOARD[row][col] = color;
    flipPieces();
    updateScore(color);
    calculateLegalMoves(color);
    drawLegalMoves();
    EMPTY_CELLS -= 1;
}

function updateScore(color) {
    const flipped = TO_BE_FLIPPED[LAST_MOVE].length;
    const blacksElement = document.getElementById("blacks");
    const whitesElement = document.getElementById("whites");
    const oldBlacks = parseInt(blacksElement.innerText);
    const oldWhites = parseInt(whitesElement.innerText);
    if (color === 1) {
        blacksElement.innerText = oldBlacks - flipped;
        whitesElement.innerText = oldWhites + flipped + 1;
    } else {
        blacksElement.innerText = oldBlacks + flipped + 1;
        whitesElement.innerText = oldWhites - flipped;
    }
}

/*
Notes about Othello language:
    * cell(Row, Col, Color) encodes what is shown in each cell (Color is either 1, or -1 or 0);
    * legalMove(Row, Col);
    * move(X, Y) should be used as the predicate indicating which move should be preferred.
*/