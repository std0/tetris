const boardCvs = document.getElementById("boardCanvas");
const boardCtx = boardCvs.getContext("2d");
const BOARD_ROWS = 20;
const BOARD_COLS = 10;

const nextCvs = document.getElementById("nextCanvas");
const nextCtx = nextCvs.getContext("2d");
const NEXT_ROWS = 4;
const NEXT_COLS = NEXT_ROWS;

const SQUARE_PX = 30;

const COLORS = {
    0: "#ffffff",
    1: "#e85f5c",
    2: "#f0f66e",
    3: "#ce6fcf",
    4: "#386fa4",
    5: "#70d6ff",
    6: "#7bc950",
    7: "#ffaa5a",
    8: "#221d23"
};
const EMPTY_COLOR = 0;
const STROKE_COLOR = 8;

function drawSquare(ctx, x, y, colorIndex) {
    ctx.fillStyle = COLORS[colorIndex];
    ctx.fillRect(x * SQUARE_PX,y * SQUARE_PX, SQUARE_PX, SQUARE_PX);

    ctx.strokeStyle = COLORS[STROKE_COLOR];
    ctx.strokeRect(x * SQUARE_PX,y * SQUARE_PX, SQUARE_PX, SQUARE_PX);
}

class Grid {
    constructor(ctx, rows, cols) {
        this.ctx = ctx;
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(EMPTY_COLOR));
        this.figure = null;
        this.draw();
    }

    draw() {
        for (let [i, row] of this.grid.entries()) {
            for (let [j, square] of row.entries()) {
                drawSquare(this.ctx, j, i, square);
            }
        }
    }

    fillFigure(color) {
        for (let [i, row] of this.figure.struct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 1) {
                    drawSquare(this.ctx, this.figure.x + j, this.figure.y + i, color);
                }
            }
        }
    }

    drawFigure() {
        this.fillFigure(this.figure.color);
    }

    eraseFigure() {
        this.fillFigure(EMPTY_COLOR);
    }
}

function* generateFigure() {
    let structTypes = Object.keys(STRUCTS);
    while (true) {
        let randomType = structTypes[Math.floor(Math.random() * structTypes.length)];
        yield new Figure(randomType, STRUCTS[randomType].struct, STRUCTS[randomType].color);
    }
}

class Next extends Grid {
    constructor(nextCtx, rows, cols) {
        super(nextCtx, rows, cols);
        this.generator = generateFigure();
        this.figure = this.nextFigure;
    }

    get nextFigure() {
        return this.generator.next().value;
    }

    get currentFigure() {
        let currentFigure = this.figure;
        this.eraseFigure();

        this.figure = this.nextFigure;
        this.drawFigure();

        return currentFigure;
    }
}

class Board extends Grid {
    constructor(boardCtx, rows, cols, next) {
        super(boardCtx, rows, cols);
        this.next = next;
        this.figure = this.getNextFigure();
    }

    getNextFigure() {
        let figure = this.next.currentFigure;
        figure.x = 3;
        figure.y = -2;
        figure.board = this;
        return figure
    }

    checkCollision(newX, newY, nextState=null) {
        let state = nextState === null ? this.figure.struct : nextState;
        for (let [i, row] of state.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 0) {
                    continue;
                }

                let newSquareX = newX + j;
                let newSquareY = newY + i;

                if (newSquareX < 0 || newSquareX >= BOARD_COLS || newSquareY >= BOARD_ROWS) {
                    return true;
                }

                if (newSquareY < 0) {
                    continue;
                }

                if (this.grid[newSquareY][newSquareX] !== EMPTY_COLOR) {
                    return true;
                }
            }
        }
        return false;
    }

    lockFigure() {
        for (let [i, row] of this.figure.struct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 0) {
                    continue;
                }

                if (this.figure.y + i <= 0) {
                    clearInterval(timerId);
                    alert("Game Over");
                    return;
                }

                this.grid[this.figure.y + i][this.figure.x + j] = this.figure.color;
            }
        }

        this.removeFullRows(this.figure.y, this.figure.y + this.figure.struct.length);
        this.draw();
        let scoreElement = document.getElementById("score");
        scoreElement.innerText = `Score: ${score}`;

        this.figure = this.getNextFigure();
    }

    removeFullRows(from, to) {
        to = to > this.grid.length ? this.grid.length : to;
        for (let i = from; i < to; i++) {
            let row = this.grid[i];
            let isRowFull = true;
            for (let square of row) {
                isRowFull = isRowFull && (square !== EMPTY_COLOR);
            }

            if (isRowFull) {
                let newRow = Array(BOARD_COLS).fill(EMPTY_COLOR);
                this.grid.splice(i, 1);
                this.grid.unshift(newRow);

                score += 100;
                clearInterval(timerId);
                if (delay > 200) {
                    delay -= 50;
                }
                timerId = setInterval(() => this.figure.moveDown(), delay);
            }
        }
    }
}

const STRUCTS = {
    I: {
        struct: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: 1
    },
    J: {
        struct: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 2
    },
    L: {
        struct: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 3
    },
    O: {
        struct: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        color: 4
    },
    S: {
        struct: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: 5
    },
    T: {
        struct: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 6
    },
    Z: {
        struct: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: 7
    }
};

const STATES_N = 4;

const KICKS = [
    [[0, 0], [-1, 0], [-1, 1], [0,-2], [-1,-2]],
    [[0, 0], [ 1, 0], [ 1,-1], [0, 2], [ 1, 2]],
    [[0, 0], [ 1, 0], [ 1, 1], [0,-2], [ 1,-2]],
    [[0, 0], [-1, 0], [-1,-1], [0, 2], [-1, 2]]
];

const I_KICKS = [
    [[0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
    [[0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
    [[0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
    [[0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]]
];

function rotateMatrix(matrix) {
    matrix = [...matrix].reverse();
    return matrix[0].map((column, index) => (
        matrix.map(row => row[index])
    ));
}

class Figure {
    constructor(type, struct, color) {
        this.board = null;
        this.type = type;
        this.struct = struct;
        this.stateN = 0;
        this.x = 0;
        this.y = 0;
        this.color = color;
    }

    move(newX, newY, nextState=null) {
        let isCollided = this.board.checkCollision(newX, newY, nextState);
        if (isCollided === false) {
            this.board.eraseFigure();
            this.x = newX;
            this.y = newY;
            if (nextState !== null) {
                this.struct = nextState;
                this.stateN = ++this.stateN % STATES_N;
            }
            this.board.drawFigure();
        }
        return !isCollided;
    }

    moveLeft() {
        this.move(this.x - 1, this.y)
    }

    moveRight() {
        this.move(this.x + 1, this.y)
    }

    moveDown() {
        let isMoved = this.move(this.x, this.y + 1);
        if (isMoved === false) {
            this.board.lockFigure();
        }
    }

    rotate() {
        let nextState = rotateMatrix(this.struct);
        let kicks;
        if (STRUCTS[this.type] === STRUCTS.O) {
            return;
        } else if (STRUCTS[this.type] === STRUCTS.I) {
            kicks = I_KICKS[this.stateN];
        } else {
            kicks = KICKS[this.stateN];
        }

        for (let kick of kicks) {
            let [kickX, kickY] = kick;
            let isMoved = this.move(this.x + kickX, this.y + kickY, nextState);
            if (isMoved === true) {
                break;
            }
        }
    }
}

let next = new Next(nextCtx, NEXT_ROWS, NEXT_COLS);

let board = new Board(boardCtx, BOARD_ROWS, BOARD_COLS, next);

const KEYS_ACTIONS = {
    ArrowLeft: () => board.figure.moveLeft(),
    ArrowRight: () => board.figure.moveRight(),
    ArrowUp:  () => board.figure.rotate(),
    ArrowDown: () => board.figure.moveDown()
};

document.addEventListener("keydown", (event) => {
    if (event.key in KEYS_ACTIONS) {
        event.preventDefault();
        KEYS_ACTIONS[event.key]();
    }
});

let score = 0;
let delay = 1000;
let timerId = setInterval(() => board.figure.moveDown(), delay);
