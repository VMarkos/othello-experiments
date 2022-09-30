const othello = require("../../othello/othello");
const agents = require("../../ml_agents/agents");
const fs = require("fs");
const parsers = require("../../prudens_v0833/parsers");
const { performance } = require("perf_hooks");

function playSingleGame(OTHELLO_POLICY, black = agents.prudensMove, white = agents.randomMove) {
    const N_ROWS = 8;
    const N_COLS = 8;
    let BOARD; // 0 = empty, 1 = white, -1 = black.
    let LEGAL_MOVES; // String array, containing all cell ids that are legal moves.
    let TO_BE_FLIPPED; // List of cell ids that should be flipped.
    let EMPTY_CELLS;
    let SCORE = [2, 2];
    let ALL_DIRECTIONS = [
        [1, -1], [1, 0], [1, 1],
        [0, -1], [0, 1],
        [-1, -1], [-1, 0], [-1, 1],
    ];
    let initOutput = othello.initializeBoard(BOARD, LEGAL_MOVES, ALL_DIRECTIONS, TO_BE_FLIPPED, N_ROWS, N_COLS);
    BOARD = initOutput["BOARD"];
    LEGAL_MOVES = initOutput["LEGAL_MOVES"];
    TO_BE_FLIPPED = initOutput["TO_BE_FLIPPED"];
    EMPTY_CELLS = initOutput["EMPTY_CELLS"];
    let consecutiveFails, blackMove, whiteMove, output;
    // console.log(BOARD[3][4]);
    const moveTimes = {black: [], white: []};
    let start, end;
    do {
        consecutiveFails = 0;
        start = performance.now();
        blackMove = black(LEGAL_MOVES, BOARD, OTHELLO_POLICY, N_ROWS, N_COLS);
        end = performance.now();
        moveTimes["black"].push(end - start);
        // console.log("LM:", LEGAL_MOVES);
        if (blackMove === undefined) {
            consecutiveFails++;
            output = othello.calculateLegalMoves(BOARD, LEGAL_MOVES, TO_BE_FLIPPED, ALL_DIRECTIONS, -1, N_ROWS, N_COLS);
            LEGAL_MOVES = output["LEGAL_MOVES"];
            TO_BE_FLIPPED = output["TO_BE_FLIPPED"];
        } else {
            output = othello.makeSingleMove(BOARD, LEGAL_MOVES, EMPTY_CELLS, TO_BE_FLIPPED, ALL_DIRECTIONS, SCORE, blackMove[0], blackMove[1], -1, N_ROWS, N_COLS);
            BOARD = output["BOARD"];
            LEGAL_MOVES = output["LEGAL_MOVES"];
            TO_BE_FLIPPED = output["TO_BE_FLIPPED"];
            EMPTY_CELLS = output["EMPTY_CELLS"];
            SCORE = output["score"];
        }
        start = performance.now();
        whiteMove = white(LEGAL_MOVES, N_ROWS, N_COLS);
        end = performance.now();
        moveTimes["white"].push(end - start);
        if (whiteMove === undefined) {
            consecutiveFails++;
            output = othello.calculateLegalMoves(BOARD, LEGAL_MOVES, TO_BE_FLIPPED, ALL_DIRECTIONS, 1, N_ROWS, N_COLS);
            LEGAL_MOVES = output["LEGAL_MOVES"];
            TO_BE_FLIPPED = output["TO_BE_FLIPPED"];
        } else {
            // console.log(BOARD);
            output = othello.makeSingleMove(BOARD, LEGAL_MOVES, EMPTY_CELLS, TO_BE_FLIPPED, ALL_DIRECTIONS, SCORE, whiteMove[0], whiteMove[1], 1, N_ROWS, N_COLS);
            BOARD = output["BOARD"];
            LEGAL_MOVES = output["LEGAL_MOVES"];
            TO_BE_FLIPPED = output["TO_BE_FLIPPED"];
            EMPTY_CELLS = output["EMPTY_CELLS"];
            SCORE = output["score"];
        }
        // console.log("White:", whiteMove);
    } while (EMPTY_CELLS > 0 && consecutiveFails < 2);
    return {
        moveTimes: moveTimes,
        score: SCORE[1] - SCORE[0],
    };
}

function experiment() {
    const policies = [
        `@KnowledgeBase
        D1 :: legalMove(X,Y) implies move(X,Y);`,
        `@KnowledgeBase
        D1 :: legalMove(X,Y) implies move(X,Y);
        D2 :: legalMove(X,Y), legalMove(Z,W), corner(Z,W), -?=(X,Z) implies -move(X,Y);
        D3 :: legalMove(X,Y), legalMove(Z,W), corner(Z,W), -?=(Y,W) implies -move(X,Y);
        C1 :: implies corner(0, 0);
        C2 :: implies corner(0,7);
        C3 :: implies corner(7,0);
        C4 :: implies corner(7,7);
        R1 :: legalMove(X,Y), corner(X,Y) implies move(X,Y);`,
        `@KnowledgeBase
        D1 :: legalMove(X,Y) implies move(X,Y);
        D2 :: legalMove(X,Y), legalMove(Z,W), corner(Z,W), -?=(X,Z) implies -move(X,Y);
        D3 :: legalMove(X,Y), legalMove(Z,W), corner(Z,W), -?=(Y,W) implies -move(X,Y);
        C1 :: implies corner(0, 0);
        C2 :: implies corner(0,7);
        C3 :: implies corner(7,0);
        C4 :: implies corner(7,7);
        R1 :: legalMove(X,Y), corner(X,Y) implies move(X,Y);
        R2 :: corner(X,Y), legalMove(Z,W), ?isAdj(X,Y,Z,W) implies -move(Z,W);

        @Procedures
        function isAdj(x,y,z,w) {
            const X = parseInt(x);
            const Y = parseInt(y);
            const Z = parseInt(z);
            const W = parseInt(w);
            return Z-X < 2 && X-Z < 2 && W-Y < 2 && Y-W < 2 && (X != Z || Y != W);
        }`,
    ];
    const N_GAMES = 1000;
    const results = [];
    process.stdout.write("Experiments 01:");
    let policy;
    for (let p = 0; p < policies.length; p++) {
        process.stdout.write("\nPolicy: " + p + ":\n");
        policy = policies[p];
        OTHELLO_POLICY = parsers.parseKB(policy);
        results[p] = [];
        for (let i = 0; i < N_GAMES; i++) {
            process.stdout.write((i + 1) + " / " + N_GAMES + "\r");
            results[p].push(playSingleGame(OTHELLO_POLICY));
        }
    }
    process.stdout.write("Writing output...\r");
    fs.writeFileSync("testResults.json", JSON.stringify(results, null, 2));
    process.stdout.write("Process Complete!\n");
}

function parseResultsToGNU(results) {
    const expsPath = "experiments/exps_01";
    const avgPolicyScores = [], scoreStds = [], scoreCounts = [[], [], []];
    const scoreFns = [
        (x) => {return x < 0},
        (x) => {return x === 0},
        (x) => {return x > 0},
    ];
    const scoreDistributions = [];
    let policy, scoreFn;
    for (let i = 0; i < results.length; i++) {
        policy = results[i];
        avgPolicyScores.push(getAvgScore(policy));
        scoreStds.push(getScoreStd(policy));
        for (let j = 0; j < scoreFns.length; j++) {
            scoreFn = scoreFns[j];
            scoreCounts[j].push(getResRate(policy, scoreFn));
        }
        scoreDistributions.push(getScoreDistribution(policy));
    }
    const avgPolicyScoresDir = "plots/avgScores";
    if (!fs.existsSync(expsPath + "/" + avgPolicyScoresDir)) {
        fs.mkdirSync(expsPath + "/" + avgPolicyScoresDir, {recursive: true});
    }
    fs.writeFileSync(expsPath + "/" + avgPolicyScoresDir + "/allPolicies.table", arrayToGNU(avgPolicyScores));
    fs.writeFileSync(expsPath + "/" + avgPolicyScoresDir + "/stds.table", arraysToGNU(avgPolicyScores, scoreStds));
    fs.writeFileSync(expsPath + "/" + avgPolicyScoresDir + "/scoreCounts.table", arraysToGNU(...scoreCounts));
    for (let i = 0; i < scoreDistributions.length; i++) {
        fs.writeFileSync(expsPath + "/" + avgPolicyScoresDir + "/scoreDist" + i + ".table", arrayToGNU(scoreDistributions[i]));
    }
}

function getAvgScore(policy) {
    let avg = 0;
    for (const result of policy) {
        avg += result["score"];
    }
    return avg / policy.length;
}

function getScoreStd(policy) {
    let sqSum = 0.0, sum = 0.0;
    for (const result of policy) {
        sqSum += result["score"] * result["score"];
        sum += result["score"];
    }
    return Math.sqrt((sqSum - sum * sum / policy.length) / policy.length);
}

function getResRate(policy, scoreFn) {
    let count = 0;
    for (const result of policy) {
        if (scoreFn(result["score"])) {
            count++;
        }
    }
    return count;
}

function getScoreDistribution(policy, binSize = 4, range = 128) {
    const distribution = [];
    const nBins = Math.floor(range / binSize);
    const step = 1 / (binSize * policy.length);
    for (let i = 0; i < nBins; i++) {
        distribution[i] = 0.0;
    }
    for (const result of policy) {
        distribution[Math.floor((result["score"] + range / 2) / binSize)] += step;
    }
    return distribution;
}

function arraysToGNU() {
    let string = "";
    for (let i = 0; i < arguments[0].length; i++) {
        string += i + " ";
        for (let j = 0; j < arguments.length; j++) {
            string += arguments[j][i] + " ";
        }
        string += "\n";
    }
    return string;
}

function arrayToGNU(array) {
    let string = "";
    for (let i = 0; i < array.length; i++) {
        string += i + " " + array[i] + "\n";
    }
    return string;
}

module.exports = {
    experiment,
    parseResultsToGNU,
}