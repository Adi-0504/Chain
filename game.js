const BOARD_SIZE = 8;
const MAX_UNDO = 3;

const SHAPES = [
  {
    name: "L",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ]
  },

  {
    name: "T",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1]
    ]
  },

  {
    name: "Z",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1]
    ]
  },

  {
    name: "Corner",
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 2]
    ]
  },

  {
    name: "Plus",
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2]
    ]
  },

  {
    name: "Step",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2]
    ]
  }
];

const CHALLENGES = [
  {
    id: "warmup",
    stars: 1,
    shape: SHAPES[0],
    neutralCount: 7
  },

  {
    id: "balance",
    stars: 2,
    shape: SHAPES[1],
    neutralCount: 11
  },

  {
    id: "precision",
    stars: 3,
    shape: SHAPES[4],
    neutralCount: 15
  }
];

const Game = {

  board: [],
  history: [],
  undoCount: MAX_UNDO,

  currentChallenge: null,

  currentPiece: null,
  nextPiece: null,

  rotation: 0,
  mirrored: false,

  score: 0,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    document
      .getElementById("rotateButton")
      .addEventListener(
        "click",
        () => this.rotate()
      );

    document
      .getElementById("mirrorButton")
      .addEventListener(
        "click",
        () => this.mirror()
      );

    document
      .getElementById("undoButton")
      .addEventListener(
        "click",
        () => this.undo()
      );
  },

  createBoard() {
    this.board =
      Array.from(
        { length: BOARD_SIZE },
        () =>
          Array(
            BOARD_SIZE
          ).fill(null)
      );

    this.placeNeutralPieces();
  },

  placeNeutralPieces() {
    const amount =
      this.currentChallenge.neutralCount;

    let placed = 0;

    while (placed < amount) {
      const row =
        Math.floor(
          Math.random() *
          BOARD_SIZE
        );

      const col =
        Math.floor(
          Math.random() *
          BOARD_SIZE
        );

      if (
        this.board[row][col] ===
        null
      ) {
        this.board[row][col] =
          "neutral";

        placed++;
      }
    }
  },

  createPiece() {
    this.currentPiece =
      this.cloneShape(
        this.currentChallenge.shape.cells
      );

    this.nextPiece =
      SHAPES[
        Math.floor(
          Math.random() *
          SHAPES.length
        )
      ].cells;

    this.rotation = 0;
    this.mirrored = false;
  },

  cloneShape(cells) {
    return cells.map(
      ([x, y]) => [x, y]
    );
  },

  transformedPiece() {
    let cells =
      this.cloneShape(
        this.currentPiece
      );

    if (this.mirrored) {
      cells =
        cells.map(
          ([x, y]) => [-x, y]
        );
    }

    for (
      let i = 0;
      i < this.rotation;
      i++
    ) {
      cells =
        cells.map(
          ([x, y]) => [-y, x]
        );
    }

    const minX =
      Math.min(
        ...cells.map(
          cell => cell[0]
        )
      );

    const minY =
      Math.min(
        ...cells.map(
          cell => cell[1]
        )
      );

    return cells.map(
      ([x, y]) => [
        x - minX,
        y - minY
      ]
    );
  },

  canPlace(cells, row, col) {
    return cells.every(
      ([x, y]) => {
        const r = row + y;
        const c = col + x;

        if (
          r < 0 ||
          r >= BOARD_SIZE ||
          c < 0 ||
          c >= BOARD_SIZE
        ) {
          return false;
        }

        return (
          this.board[r][c] ===
          null
        );
      }
    );
  },

  placePiece(cells, row, col) {
    this.history.push(
      this.board.map(
        row =>
          [...row]
      )
    );

    cells.forEach(
      ([x, y]) => {
        this.board[row + y][col + x] =
          "player";
      }
    );

    this.score +=
      cells.length * 10;

    AudioManager.play("place");

    this.renderBoard();

    const placedCells =
      cells.map(
        ([x, y]) =>
          document.querySelector(
            `[data-row="${row + y}"][data-col="${col + x}"]`
          )
      );

    ChainAnimation.place(
      placedCells
    );

    this.checkCompletion();
  },

  rotate() {
    this.rotation =
      (this.rotation + 1) % 4;

    AudioManager.play("rotate");

    this.renderBoard();
  },

  mirror() {
    this.mirrored =
      !this.mirrored;

    AudioManager.play("rotate");

    this.renderBoard();
  },

  undo() {
    if (
      this.undoCount <= 0 ||
      this.history.length === 0
    ) {
      return;
    }

    this.board =
      this.history.pop();

    this.undoCount--;

    this.updateUndo();

    AudioManager.play("click");

    this.renderBoard();
  },

  checkCompletion() {
    const target =
      this.transformedPiece();

    const playerCells = [];

    for (
      let row = 0;
      row < BOARD_SIZE;
      row++
    ) {
      for (
        let col = 0;
        col < BOARD_SIZE;
        col++
      ) {
        if (
          this.board[row][col] ===
          "player"
        ) {
          playerCells.push([
            row,
            col
          ]);
        }
      }
    }

    if (
      playerCells.length <
      target.length
    ) {
      return;
    }

    const match =
      this.findShapeMatch(
        target,
        playerCells
      );

    if (match) {
      this.completeChallenge(
        match
      );
    }
  },

  findShapeMatch(
    target,
    playerCells
  ) {
    const targetSet =
      new Set(
        target.map(
          ([x, y]) =>
            `${x},${y}`
        )
      );

    for (
      const [row, col]
      of playerCells
    ) {
      for (
        const [anchorX, anchorY]
        of target
      ) {
        const startRow =
          row - anchorY;

        const startCol =
          col - anchorX;

        const matched =
          target.every(
            ([x, y]) =>
              this.board[
                startRow + y
              ]?.[
                startCol + x
              ] ===
              "player"
          );

        if (!matched) {
          continue;
        }

        const cells =
          target.map(
            ([x, y]) =>
              document.querySelector(
                `[data-row="${startRow + y}"][data-col="${startCol + x}"]`
              )
          );

        return {
          cells,
          key:
            [...targetSet]
              .join("|")
        };
      }
    }

    return null;
  },

  completeChallenge(match) {
    if (
      this.isCompleting
    ) {
      return;
    }

    this.isCompleting = true;

    AudioManager.play(
      "success"
    );

    match.cells.forEach(
      cell =>
        cell.classList.add(
          "correct"
        )
    );

    ChainAnimation
      .success(match.cells)
      .then(() => {
        AudioManager.play(
          "complete"
        );

        return ChainAnimation
          .clearBoard(match.cells);
      })
      .then(() => {
        this.finishRound();
      });
  },

  finishRound() {
    this.isCompleting = false;

    App.showResult(
      this.score
    );
  },

  start(challenge) {
    this.currentChallenge =
      challenge;

    this.history = [];
    this.undoCount =
      MAX_UNDO;

    this.score = 0;

    this.createBoard();
    this.createPiece();

    this.renderBoard();
    this.renderTarget();
    this.renderNextPiece();

    this.updateUndo();

    document.getElementById(
      "gameChallengeName"
    ).textContent =
      i18next.t(
        "challenge.card.challenge",
        {
          number:
            CHALLENGES.indexOf(
              challenge
            ) + 1
        }
      );

    document.getElementById(
      "scoreValue"
    ).textContent =
      this.score;

    document.getElementById(
      "difficultyStars"
    ).innerHTML =
      this.stars(
        challenge.stars
      );
  },

  renderBoard() {
    const board =
      document.getElementById(
        "board"
      );

    board.innerHTML = "";

    for (
      let row = 0;
      row < BOARD_SIZE;
      row++
    ) {
      for (
        let col = 0;
        col < BOARD_SIZE;
        col++
      ) {
        const cell =
          document.createElement(
            "button"
          );

        cell.type = "button";
        cell.className =
          "cell";

        cell.dataset.row =
          row;

        cell.dataset.col =
          col;

        const value =
          this.board[row][col];

        if (
          value === "player"
        ) {
          cell.classList.add(
            "player"
          );
        }

        if (
          value === "neutral"
        ) {
          cell.classList.add(
            "neutral"
          );
        }

        cell.addEventListener(
          "click",
          () =>
            this.handleCell(
              row,
              col,
              cell
            )
        );

        board.appendChild(
          cell
        );
      }
    }
  },

  handleCell(row, col, cell) {
    if (
      this.board[row][col] ===
      "neutral"
    ) {
      AudioManager.play(
        "neutral"
      );

      ChainAnimation
        .neutralTap(cell);

      App.toast(
        i18next.t(
          "game.neutral"
        )
      );

      return;
    }

    if (
      this.board[row][col] ===
      "player"
    ) {
      return;
    }

    const piece =
      this.transformedPiece();

    if (
      !this.canPlace(
        piece,
        row,
        col
      )
    ) {
      AudioManager.play(
        "neutral"
      );

      cell.classList.add(
        "wrong"
      );

      setTimeout(
        () =>
          cell.classList.remove(
            "wrong"
          ),
        300
      );

      App.toast(
        i18next.t(
          "game.blocked"
        )
      );

      return;
    }

    this.placePiece(
      piece,
      row,
      col
    );
  },

  renderTarget() {
    document.getElementById(
      "targetName"
    ).textContent =
      this.currentChallenge
        .shape.name;

    const preview =
      document.getElementById(
        "targetPreview"
      );

    preview.innerHTML =
      this.createMiniGrid(
        this.currentChallenge
          .shape.cells
      );
  },

  renderNextPiece() {
    document.getElementById(
      "nextPiecePreview"
    ).innerHTML =
      this.createPieceGrid(
        this.nextPiece
      );
  },

  createMiniGrid(cells) {
    const set =
      new Set(
        cells.map(
          ([x, y]) =>
            `${x},${y}`
        )
      );

    let html =
      '<div class="mini-grid">';

    for (
      let y = 0;
      y < 5;
      y++
    ) {
      for (
        let x = 0;
        x < 5;
        x++
      ) {
        html +=
          `<div class="mini-cell ${
            set.has(`${x},${y}`)
              ? "active"
              : "empty"
          }"></div>`;
      }
    }

    html += "</div>";

    return html;
  },

  createPieceGrid(cells) {
    const set =
      new Set(
        cells.map(
          ([x, y]) =>
            `${x},${y}`
        )
      );

    let html =
      '<div class="piece-grid">';

    for (
      let y = 0;
      y < 5;
      y++
    ) {
      for (
        let x = 0;
        x < 5;
        x++
      ) {
        html +=
          `<div class="piece-cell ${
            set.has(`${x},${y}`)
              ? ""
              : "empty"
          }"></div>`;
      }
    }

    html += "</div>";

    return html;
  },

  updateUndo() {
    document.getElementById(
      "undoCount"
    ).textContent =
      this.undoCount;
  },

  stars(count) {
    return Array
      .from(
        { length: 3 },
        (_, index) =>
          `<i data-lucide="star" ${
            index < count
              ? 'class="filled-star"'
              : ""
          }></i>`
      )
      .join("");
  }
};