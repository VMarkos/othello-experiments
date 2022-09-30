const exps01 = require("./experiments/exps_01/exps_01");
const fs = require("fs");

function main() {
    const resultsPath = "testResults.json";
    const results = JSON.parse(fs.readFileSync(resultsPath, {encoding: "utf8"}));
    exps01.parseResultsToGNU(results);
}

main();