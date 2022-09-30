const OLD_POLICY = `@KnowledgeBase
R1 :: legalMove(X, Y) implies move(X, Y);
R2 :: legalMove(0, 0), legalMove(X, Y), -?=(X, 0) implies -move(X, Y);
R3 :: legalMove(0, 0), legalMove(X, Y), -?=(Y, 0) implies -move(X, Y);
R4 :: legalMove(0, 0) implies move(0, 0);
R5 :: legalMove(0, 7), legalMove(X, Y), -?=(X, 0) implies -move(X, Y);
R6 :: legalMove(0, 7), legalMove(X, Y), -?=(Y, 7) implies -move(X, Y);
R7 :: legalMove(0, 7) implies move(0, 7);
R8 :: legalMove(7, 0), legalMove(X, Y), -?=(X, 7) implies -move(X, Y);
R9 :: legalMove(7, 0), legalMove(X, Y), -?=(Y, 0) implies -move(X, Y);
R10 :: legalMove(7, 0) implies move(7, 0);
R11 :: legalMove(7, 7), legalMove(X, Y), -?=(X, 7) implies -move(X, Y);
R12 :: legalMove(7, 7), legalMove(X, Y), -?=(Y, 7) implies -move(X, Y);
R13 :: legalMove(7, 7) implies move(7, 7);`

const TEST_POLICY = `@KnowledgeBase
Dummy :: legalMove(X, Y) implies move(X, Y);`

let policyContainer = document.getElementById("policy-container");

let policyEditor = CodeMirror(policyContainer, {
    lineNumbers: true,
    tabSize: 2,
    gutter: true,
    value: TEST_POLICY,
    theme: "monokai",
    mode: "simplemode",
    lineWrapping: true,
});

policyEditor.setSize(400, 640);

/*
Formerly utils.js
*/

function otDeduce() {
  "use strict";
  const kbObject = otKbParser();
  if (kbObject["type"] === "error") {
      return "ERROR: " + kbObject["name"] + ":\n" + kbObject["message"];
  }
  const warnings = kbObject["warnings"];
  const contextObject = otContextParser();
  if (contextObject["type"] === "error") {
      return "ERROR: " + contextObject["name"] + ":\n" + contextObject["message"];
  }
  console.log(contextObject); // TODO fix some context parsing issue (in propositional cases it includes the semicolon into the name of the prop)
  const output = forwardChaining(kbObject, contextObject["context"]);
  const inferences = output["facts"];
  // console.log(graph);
  return contextToString(inferences);
}

function otKbParser() {
  const kbAll = policyEditor.getValue();
  return parseKB(kbAll);
}

function otContextParser() {
  const context = extractContext();
  const contextList = parseContext(context);
  // console.log(contextList);
  if (contextList["type"] === "error") {
      return contextList;
  }
  return contextList;
}

function displayInfo() {
    const otMainCard = document.getElementById("othello-main-card");
    const otHelp = document.getElementById("othello-help");
    changeTabs(otMainCard, otHelp);
}

function displayBoard() {
	const otMainCard = document.getElementById("othello-main-card");
    const otHelp = document.getElementById("othello-help");
    changeTabs(otHelp, otMainCard);
}

function changeTabs(e1, e2) {
    e1.classList.add("shrink-to-center");
    setTimeout(
        () => {
            e1.classList.add("no-display");
            e1.classList.add("invisible");
            e1.style.scale = "0%";
            e2.classList.remove("shrink-to-center");
            e2.classList.remove("no-display");
            e2.offsetHeight;
            e2.style.scale = "100%";
        },
        600
    );
}
