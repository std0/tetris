const cvs = document.getElementById("boardCanvas");
const ctx = cvs.getContext("2d");

const ROWS = 20;
const COLS = 10;
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
    constructor(ctx, rows, cols, filler) {
        this.ctx = ctx;
        this.board = Array(rows).fill(null).map(() => Array(cols).fill(filler));
    }

    draw() {
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                drawSquare(this.ctx, j, i, this.board[i][j]);
            }
        }
    }
}

class Board extends Grid {
    constructor(ctx, rows, cols, filler) {
        super(ctx, rows, cols, filler);
        this.figure = this.getRandomFigure();
    }

    getRandomFigure() {
        let rand = Math.floor(Math.random() * STRUCTS.length);
        return new Figure(this, STRUCTS[rand].struct, STRUCTS[rand].color);
    }

    checkCollision(newX, newY, nextStruct) {
        for (let [i, row] of nextStruct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 0) {
                    continue;
                }

                let newSquareX = newX + j;
                let newSquareY = newY + i;

                if (newSquareX < 0 || newSquareX >= COLS || newSquareY >= ROWS) {
                    return true;
                }

                if (newSquareY < 0) {
                    continue;
                }

                if (this.board[newSquareY][newSquareX] !== EMPTY_COLOR) {
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

                this.board[this.figure.y + i][this.figure.x + j] = this.figure.color;
            }
        }

        this.removeFullRows(this.figure.y, this.figure.y + this.figure.struct.length);
        this.draw();
        // TODO: Update score UI.

        this.figure = this.getRandomFigure();
    }

    removeFullRows(from, to) {
        to = to > this.board.length ? this.board.length : to;
        for (let i = from; i < to; i++) {
            let row = this.board[i];
            let isRowFull = true;
            for (let square of row) {
                isRowFull = isRowFull && (square !== EMPTY_COLOR);
            }

            if (isRowFull) {
                let newRow = Array(COLS).fill(EMPTY_COLOR);
                this.board.splice(i, 1);
                this.board.unshift(newRow);

                score += 100;
                clearInterval(timerId);
                if (delay > 100) {
                    delay -= 50;
                }
                timerId = setInterval(() => this.figure.moveDown(), delay);
            }
        }
    }
}

const STRUCTS = [
    {
        struct: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: 1
    },
    {
        struct: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 2
    },
    {
        struct: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 3
    },
    {
        struct: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        color: 4
    },
    {
        struct: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: 5
    },
    {
        struct: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 6
    },
    {
        struct: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: 7
    }
];

function rotateMatrix(matrix) {
    matrix = [...matrix].reverse();
    return matrix[0].map((column, index) => (
        matrix.map(row => row[index])
    ));
}

class Figure {
    constructor(board, struct, color) {
        this.board = board;
        this.struct = struct;
        this.color = color;
        this.x = 3;
        this.y = -2;
    }

    fill(color) {
        for (let [i, row] of this.struct.entries()) {
            for (let [j, square] of row.entries()) {
                if (square === 1) {
                    drawSquare(this.board.ctx, this.x + j, this.y + i, color);
                }
            }
        }
    }

    draw() {
        this.fill(this.color);
    }

    erase() {
        this.fill(EMPTY_COLOR);
    }

    moveLeft() {
        if (this.board.checkCollision(this.x - 1, this.y, this.struct) === false) {
            this.erase();
            this.x--;
            this.draw();
        }
    }

    moveRight() {
        if (this.board.checkCollision(this.x + 1, this.y, this.struct) === false) {
            this.erase();
            this.x++;
            this.draw();
        }
    }

    moveDown() {
        if (this.board.checkCollision(this.x, this.y + 1, this.struct) === false) {
            this.erase();
            this.y++;
            this.draw();
        } else {
            this.board.lockFigure();
        }
    }

    rotate() {
        let nextStruct = rotateMatrix(this.struct);
        let kick = 0;

        while (this.board.checkCollision(this.x + kick, this.y, nextStruct) === true) {
            if (this.x > COLS / 2) {
                // Right half of board.
                kick--;
            } else {
                // Left half of board.
                kick++;
            }
        }

        this.erase();
        this.x += kick;
        this.struct = nextStruct;
        this.draw();
    }
}

let board = new Board(ctx, ROWS, COLS, EMPTY_COLOR);
board.draw();
board.figure.draw();

document.addEventListener("keydown", handleKeydown);

const KEYS = {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown"
};

function handleKeydown(event) {
    if (event.key === KEYS.left) {
        board.figure.moveLeft();
    } else if (event.key === KEYS.right) {
        board.figure.moveRight();
    } else if (event.key === KEYS.up) {
        board.figure.rotate();
    } else if (event.key === KEYS.down) {
        board.figure.moveDown()
    }
}

let score = 0;
let delay = 1000;
let timerId = setInterval(() => board.figure.moveDown(), delay);
