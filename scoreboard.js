const scoreboardElement = document.getElementById("scoreboardTable");

let scoreboard = localStorage["scoreboard"];
scoreboard = scoreboard !== undefined ? JSON.parse(scoreboard) : [];

const newScoreIndex = +localStorage["newScoreIndex"];
delete localStorage["newScoreIndex"];

for (let [i, score] of scoreboard.entries()) {
    let tr = document.createElement("tr");
    if (i === newScoreIndex) {
        tr.className = "new-score";
    }

    for (let key of Object.keys(score)) {
        let td = document.createElement("td");
        td.innerText = score[key];
        tr.appendChild(td);
    }

    scoreboardElement.tBodies.item(0).appendChild(tr);
}

function exportScoreboard() {
    let file = new Blob([JSON.stringify(scoreboard)], {type: "application/json"});
    let a = document.createElement("a");
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = "tetrisScoreboard.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}