(() => {
  "use strict";

  const BOARD_SIZE = 8;
  const MAX_UNDO = 3;
  const CHALLENGES_PER_ROUND = 3;

  const DIFFICULTY_CONFIG = {
    1: {
      minCells: 3,
      maxCells: 4,
      rotations: false,
      mirrors: false
    },
    2: {
      minCells: 4,
      maxCells: 5,
      rotations: true,
      mirrors: false
    },
    3: {
      minCells: 5,
      maxCells: 6,
      rotations: true,
      mirrors: true
    },
    4: {
      minCells: 6,
      maxCells: 8,
      rotations: true,
      mirrors: true
    },
    5: {
      minCells: 7,
      maxCells: 10,
      rotations: true,
      mirrors: true
    }
  };

  const state = {
    board: [],
    history: [],
    undoRemaining: MAX_UNDO,

    round: 1,
    score: 0,

    selectedChallenge: null,
    currentChallenge: null,

    challengePool: [],
    currentOptions: [],

    nextPiece: null,

    busy: false
  };

  const dom = {};

  function $(selector) {
    return document.querySelector(selector);
  }

  function init() {
    dom.board = $("#game-board");
    dom.challengeGrid = $("#challenge-grid");

    dom.targetPreview = $("#target-preview");
    dom.nextPreview = $("#next-preview");

    dom.gameTitle = $("#game-title");
    dom.gameStars = $("#game-stars");

    dom.roundNumber = $("#round-number");

    dom.undoButton = $("#undo-button");
    dom.undoCount = $("#undo-count");

    dom.resultScore = $("#result-score");
    dom.resultDifficulty = $("#result-difficulty");

    dom.startButton = $("#start-button");
    dom.continueButton = $("#continue-button");
    dom.endButton = $("#end-button");
    dom.backButton = $("#back-button");

    buildPuzzlePool();
    resetBoard();
    bindEvents();
  }

  /*
   * ---------------------------------------------------------
   * PUZZLE POOL
   * ---------------------------------------------------------
   *
   * We generate many normalized connected shapes instead of
   * storing only three hard-coded challenges.
   */

  function buildPuzzlePool() {
    const pool = [];

    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const config = DIFFICULTY_CONFIG[difficulty];

      let attempts = 0;

      while (
        pool.filter(p => p.difficulty === difficulty).length < 14 &&
        attempts < 3000
      ) {
        attempts++;

        const shape = generateShape(
          randomInt(config.minCells, config.maxCells)
        );

        if (!shape) {
          continue;
        }

        const normalized = normalizeShape(shape);

        if (!isValidShape(normalized)) {
          continue;
        }

        const signature = shapeSignature(normalized);

        if (
          pool.some(
            puzzle =>
              puzzle.difficulty === difficulty &&
              puzzle.signature === signature
          )
        ) {
          continue;
        }

        pool.push({
          id: `puzzle-${difficulty}-${pool.length + 1}`,
          difficulty,
          shape: normalized,
          signature,
          rotations: config.rotations,
          mirrors: config.mirrors
        });
      }
    }

    state.challengePool = pool;

    /*
     * Safety fallback.
     * Even if a browser behaves strangely during generation,
     * the game still has enough valid puzzles to run.
     */
    if (state.challengePool.length < 15) {
      state.challengePool.push(
        ...createFallbackPuzzles()
      );
    }
  }

  function generateShape(cellCount) {
    const cells = [{ x: 0, y: 0 }];
    const occupied = new Set(["0,0"]);

    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];

    let attempts = 0;

    while (cells.length < cellCount && attempts < 300) {
      attempts++;

      const source =
        cells[randomInt(0, cells.length - 1)];

      const direction =
        directions[randomInt(0, directions.length - 1)];

      const candidate = {
        x: source.x + direction.x,
        y: source.y + direction.y
      };

      const key = `${candidate.x},${candidate.y}`;

      if (occupied.has(key)) {
        continue;
      }

      occupied.add(key);
      cells.push(candidate);
    }

    return cells.length === cellCount ? cells : null;
  }

  function normalizeShape(shape) {
    const minX = Math.min(...shape.map(cell => cell.x));
    const minY = Math.min(...shape.map(cell => cell.y));

    return shape
      .map(cell => ({
        x: cell.x - minX,
        y: cell.y - minY
      }))
      .sort((a, b) => {
        if (a.y !== b.y) {
          return a.y - b.y;
        }

        return a.x - b.x;
      });
  }

  function isValidShape(shape) {
    if (!shape || shape.length < 3) {
      return false;
    }

    const width =
      Math.max(...shape.map(cell => cell.x)) + 1;

    const height =
      Math.max(...shape.map(cell => cell.y)) + 1;

    return width <= 4 && height <= 4;
  }

  function shapeSignature(shape) {
    return shape
      .map(cell => `${cell.x}:${cell.y}`)
      .join("|");
  }

  function createFallbackPuzzles() {
    const shapes = [
      [[0, 0], [1, 0], [0, 1]],
      [[0, 0], [1, 0], [2, 0]],
      [[0, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[0, 0], [1, 0], [2, 0], [1, 1]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]
    ];

    return shapes.map((shape, index) => ({
      id: `fallback-${index}`,
      difficulty: (index % 5) + 1,
      shape: normalizeShape(
        shape.map(([x, y]) => ({ x, y }))
      ),
      signature: shapeSignature(
        normalizeShape(
          shape.map(([x, y]) => ({ x, y }))
        )
      ),
      rotations: index > 1,
      mirrors: index > 3
    }));
  }

  function getRandomChallenges() {
    const shuffled = [...state.challengePool]
      .sort(() => Math.random() - 0.5);

    const selected = [];

    for (const puzzle of shuffled) {
      if (
        selected.length >= CHALLENGES_PER_ROUND
      ) {
        break;
      }

      /*
       * Avoid showing three identical difficulty levels
       * whenever enough puzzles are available.
       */
      if (
        selected.some(
          item => item.difficulty === puzzle.difficulty
        ) &&
        state.challengePool.length > 20
      ) {
        continue;
      }

      selected.push(puzzle);
    }

    /*
     * Safety fallback.
     */
    while (selected.length < CHALLENGES_PER_ROUND) {
      selected.push(
        state.challengePool[
          randomInt(0, state.challengePool.length - 1)
        ]
      );
    }

    return selected;
  }

  /*
   * ---------------------------------------------------------
   * BOARD
   * ---------------------------------------------------------
   */

  function createEmptyBoard() {
    return Array.from(
      { length: BOARD_SIZE },
      () => Array(BOARD_SIZE).fill(null)
    );
  }

  function resetBoard() {
    state.board = createEmptyBoard();
    state.history = [];
    state.undoRemaining = MAX_UNDO;
    state.nextPiece = createRandomPiece();

    /*
     * Add neutral pieces after the board is created.
     */
    placeNeutralPieces();

    renderBoard();
    renderUndo();
    renderNextPiece();
  }

  function placeNeutralPieces() {
    /*
     * Keep the neutral density moderate so the puzzle remains
     * playable.
     */
    const count = randomInt(7, 11);

    const positions = [];

    let attempts = 0;

    while (
      positions.length < count &&
      attempts < 500
    ) {
      attempts++;

      const x = randomInt(0, BOARD_SIZE - 1);
      const y = randomInt(0, BOARD_SIZE - 1);

      if (
        positions.some(
          position =>
            position.x === x &&
            position.y === y
        )
      ) {
        continue;
      }

      positions.push({ x, y });
    }

    for (const position of positions) {
      state.board[position.y][position.x] = "neutral";
    }
  }

  function renderBoard() {
    if (!dom.board) {
      return;
    }

    dom.board.innerHTML = "";

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cell = document.createElement("button");

        cell.type = "button";
        cell.className = "board-cell";

        cell.dataset.x = x;
        cell.dataset.y = y;

        cell.setAttribute("role", "gridcell");

        const value = state.board[y][x];

        if (value === "neutral") {
          cell.classList.add("neutral");
          cell.disabled = false;
          cell.setAttribute(
            "aria-label",
            `Neutral piece ${x + 1}, ${y + 1}`
          );
        }

        if (value === "player") {
          cell.classList.add("player");
          cell.disabled = true;
        }

        cell.addEventListener(
          "click",
          () => handleCellClick(x, y)
        );

        dom.board.appendChild(cell);
      }
    }
  }

  function handleCellClick(x, y) {
    if (state.busy) {
      return;
    }

    const value = state.board[y][x];

    if (value === "neutral") {
      AudioManager?.error?.();

      showToast(
        getTranslation(
          "game.neutralBlocked",
          "This piece cannot be used."
        )
      );

      pulseCell(x, y);

      return;
    }

    if (value === "player") {
      return;
    }

    state.history.push(
      state.board.map(row => [...row])
    );

    state.board[y][x] = "player";

    AudioManager?.place?.();

    animatePlacement(x, y);

    renderBoard();
    renderUndo();

    checkChallenge();
  }

  /*
   * ---------------------------------------------------------
   * CHALLENGE
   * ---------------------------------------------------------
   */

  function showChallenges() {
    state.busy = false;

    state.currentOptions =
      getRandomChallenges();

    if (dom.roundNumber) {
      dom.roundNumber.textContent =
        state.round;
    }

    if (!dom.challengeGrid) {
      return;
    }

    dom.challengeGrid.innerHTML = "";

    state.currentOptions.forEach(
      (challenge, index) => {
        const card =
          document.createElement("button");

        card.type = "button";
        card.className = "challenge-card";

        card.innerHTML = `
          <div class="challenge-card-header">
            <span class="challenge-number">
              ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="challenge-stars"
              aria-label="${challenge.difficulty} stars">
              ${"★".repeat(challenge.difficulty)}
            </span>
          </div>

          <div class="challenge-preview">
            ${renderShapePreview(
              challenge.shape,
              "shape-preview"
            )}
          </div>

          <div class="challenge-footer">
            <strong>
              ${getTranslation(
                "challenge.card",
                "Challenge"
              )}
            </strong>

            <span class="challenge-arrow">
              <i data-lucide="arrow-up-right"></i>
            </span>
          </div>
        `;

        card.addEventListener(
          "click",
          () => selectChallenge(challenge)
        );

        dom.challengeGrid.appendChild(card);
      }
    );

    refreshIcons();
  }

  function selectChallenge(challenge) {
    if (state.busy) {
      return;
    }

    state.selectedChallenge = challenge;
    state.currentChallenge = challenge;

    state.score = 0;

    resetBoard();

    showScreen("screen-game");

    renderCurrentChallenge();

    AudioManager?.switch?.();
  }

  function renderCurrentChallenge() {
    const challenge =
      state.currentChallenge;

    if (!challenge) {
      return;
    }

    if (dom.gameTitle) {
      dom.gameTitle.textContent =
        getTranslation(
          "challenge.card",
          "Challenge"
        );
    }

    if (dom.gameStars) {
      dom.gameStars.textContent =
        "★".repeat(challenge.difficulty);
    }

    if (dom.targetPreview) {
      dom.targetPreview.innerHTML =
        renderShapePreview(
          challenge.shape,
          "target-grid"
        );
    }

    renderNextPiece();
  }

  function renderShapePreview(
    shape,
    className
  ) {
    const width =
      Math.max(...shape.map(cell => cell.x)) + 1;

    const height =
      Math.max(...shape.map(cell => cell.y)) + 1;

    let html = `
      <div
        class="${className}"
        style="
          grid-template-columns:
          repeat(${width}, auto);
        "
      >
    `;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const exists =
          shape.some(
            cell =>
              cell.x === x &&
              cell.y === y
          );

        html += `
          <span
            class="${className === "shape-preview"
              ? "shape-preview-cell"
              : "target-cell"
            } ${exists ? "on" : "off"}"
          ></span>
        `;
      }
    }

    html += "</div>";

    return html;
  }

  /*
   * ---------------------------------------------------------
   * NEXT PIECE
   * ---------------------------------------------------------
   */

  function createRandomPiece() {
    const shapes = [
      [{ x: 0, y: 0 }],
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 0, y: 0 }, { x: 0, y: 1 }],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
    ];

    return shapes[
      randomInt(0, shapes.length - 1)
    ];
  }

  function renderNextPiece() {
    if (!dom.nextPreview || !state.nextPiece) {
      return;
    }

    dom.nextPreview.innerHTML =
      renderShapePreview(
        state.nextPiece,
        "target-grid"
      );
  }

  /*
   * ---------------------------------------------------------
   * SHAPE CHECKING
   * ---------------------------------------------------------
   */

  function checkChallenge() {
    if (!state.currentChallenge) {
      return;
    }

    const target =
      state.currentChallenge.shape;

    const playerCells = [];

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (state.board[y][x] === "player") {
          playerCells.push({ x, y });
        }
      }
    }

    if (
      playerCells.length < target.length
    ) {
      return;
    }

    const targetVariants =
      generateShapeVariants(
        target,
        state.currentChallenge
      );

    for (const player of playerCells) {
      for (const variant of targetVariants) {
        const candidates =
          translateShapeToAnchor(
            variant,
            player
          );

        if (
          candidates.length ===
          playerCells.length &&
          sameCellSet(
            candidates,
            playerCells
          )
        ) {
          completeChallenge();
          return;
        }
      }
    }
  }

  function generateShapeVariants(
    shape,
    challenge
  ) {
    const variants = [];
    let current = normalizeShape(shape);

    variants.push(current);

    if (challenge.rotations) {
      for (let i = 0; i < 3; i++) {
        current =
          rotateShape(current);

        variants.push(
          normalizeShape(current)
        );
      }
    }

    if (challenge.mirrors) {
      const mirrored =
        mirrorShape(shape);

      variants.push(
        normalizeShape(mirrored)
      );

      if (challenge.rotations) {
        let rotated = mirrored;

        for (let i = 0; i < 3; i++) {
          rotated =
            rotateShape(rotated);

          variants.push(
            normalizeShape(rotated)
          );
        }
      }
    }

    const unique = new Map();

    for (const variant of variants) {
      unique.set(
        shapeSignature(variant),
        variant
      );
    }

    return [...unique.values()];
  }

  function rotateShape(shape) {
    return shape.map(cell => ({
      x: -cell.y,
      y: cell.x
    }));
  }

  function mirrorShape(shape) {
    return shape.map(cell => ({
      x: -cell.x,
      y: cell.y
    }));
  }

  function translateShapeToAnchor(
    shape,
    anchor
  ) {
    const origin = shape[0];

    return shape.map(cell => ({
      x:
        anchor.x +
        cell.x -
        origin.x,

      y:
        anchor.y +
        cell.y -
        origin.y
    }));
  }

  function sameCellSet(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    const setA =
      new Set(
        a.map(
          cell => `${cell.x},${cell.y}`
        )
      );

    const setB =
      new Set(
        b.map(
          cell => `${cell.x},${cell.y}`
        )
      );

    if (setA.size !== setB.size) {
      return false;
    }

    for (const cell of setA) {
      if (!setB.has(cell)) {
        return false;
      }
    }

    return true;
  }

  /*
   * ---------------------------------------------------------
   * COMPLETE
   * ---------------------------------------------------------
   */

  function completeChallenge() {
    if (state.busy) {
      return;
    }

    state.busy = true;

    state.score =
      100 *
      state.currentChallenge.difficulty;

    AudioManager?.success?.();

    animateSuccess(
      getPlayerCells(),
      () => {
        showResult();
      }
    );
  }

  function showResult() {
    if (dom.resultScore) {
      dom.resultScore.textContent =
        state.score;
    }

    if (dom.resultDifficulty) {
      dom.resultDifficulty.textContent =
        "★".repeat(
          state.currentChallenge.difficulty
        );
    }

    showScreen("screen-result");

    state.busy = false;

    AudioManager?.complete?.();
  }

  /*
   * ---------------------------------------------------------
   * UNDO
   * ---------------------------------------------------------
   */

  function undo() {
    if (
      state.busy ||
      state.undoRemaining <= 0 ||
      state.history.length === 0
    ) {
      return;
    }

    state.board =
      state.history.pop();

    state.undoRemaining--;

    renderBoard();
    renderUndo();

    AudioManager?.click?.();
  }

  function renderUndo() {
    if (!dom.undoCount) {
      return;
    }

    dom.undoCount.textContent =
      state.undoRemaining;

    if (dom.undoButton) {
      dom.undoButton.disabled =
        state.undoRemaining <= 0 ||
        state.history.length === 0;
    }
  }

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function getPlayerCells() {
    const cells = [];

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (state.board[y][x] === "player") {
          cells.push({ x, y });
        }
      }
    }

    return cells;
  }

  function animatePlacement(x, y) {
    if (
      typeof gsap === "undefined"
    ) {
      return;
    }

    const cell =
      dom.board?.querySelector(
        `[data-x="${x}"][data-y="${y}"]`
      );

    if (!cell) {
      return;
    }

    gsap.fromTo(
      cell,
      {
        scale: 0.55,
        opacity: 0.45
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.22,
        ease: "back.out(2)"
      }
    );
  }

  function pulseCell(x, y) {
    if (
      typeof gsap === "undefined"
    ) {
      return;
    }

    const cell =
      dom.board?.querySelector(
        `[data-x="${x}"][data-y="${y}"]`
      );

    if (!cell) {
      return;
    }

    gsap.fromTo(
      cell,
      {
        x: -2
      },
      {
        x: 2,
        duration: 0.06,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut"
      }
    );
  }

  function animateSuccess(
    cells,
    onComplete
  ) {
    if (
      typeof window.ChainAnimation !==
      "undefined" &&
      typeof window.ChainAnimation.playSuccess ===
        "function"
    ) {
      window.ChainAnimation.playSuccess(
        cells,
        onComplete
      );

      return;
    }

    if (
      typeof gsap !== "undefined"
    ) {
      const elements = cells
        .map(
          ({ x, y }) =>
            dom.board?.querySelector(
              `[data-x="${x}"][data-y="${y}"]`
            )
        )
        .filter(Boolean);

      const timeline =
        gsap.timeline({
          onComplete
        });

      timeline
        .to(elements, {
          scale: 1.15,
          duration: 0.16,
          stagger: 0.035,
          ease: "back.out(2)"
        })
        .to(elements, {
          scale: 0,
          opacity: 0,
          duration: 0.24,
          stagger: 0.035,
          ease: "power2.in"
        });
    } else {
      onComplete();
    }
  }

  function showToast(
    message
  ) {
    const toast =
      $("#toast");

    if (!toast) {
      return;
    }

    toast.textContent = message;

    if (
      typeof gsap === "undefined"
    ) {
      toast.style.opacity = "1";

      setTimeout(() => {
        toast.style.opacity = "0";
      }, 1200);

      return;
    }

    gsap.killTweensOf(toast);

    gsap.timeline()
      .to(toast, {
        opacity: 1,
        y: 0,
        duration: 0.18,
        ease: "power2.out"
      })
      .to(toast, {
        opacity: 0,
        y: 12,
        duration: 0.2,
        delay: 1.2,
        ease: "power2.in"
      });
  }

  function showScreen(
    id
  ) {
    document
      .querySelectorAll(".screen")
      .forEach(screen => {
        screen.classList.remove(
          "active"
        );
      });

    const target =
      document.getElementById(id);

    if (target) {
      target.classList.add(
        "active"
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function refreshIcons() {
    if (
      window.lucide &&
      typeof lucide.createIcons ===
        "function"
    ) {
      lucide.createIcons();
    }
  }

  function getTranslation(
    key,
    fallback
  ) {
    if (
      window.i18next &&
      typeof i18next.t === "function"
    ) {
      return i18next.t(
        key,
        fallback
      );
    }

    return fallback;
  }

  function randomInt(
    min,
    max
  ) {
    return Math.floor(
      Math.random() *
        (max - min + 1)
    ) + min;
  }

  function bindEvents() {
    dom.startButton?.addEventListener(
      "click",
      () => {
        state.round = 1;
        showChallenges();
        showScreen(
          "screen-challenges"
        );
        AudioManager?.click?.();
      }
    );

    dom.continueButton?.addEventListener(
      "click",
      () => {
        state.round++;
        showChallenges();
        showScreen(
          "screen-challenges"
        );
        AudioManager?.click?.();
      }
    );

    dom.endButton?.addEventListener(
      "click",
      () => {
        state.round = 1;
        resetBoard();
        showScreen(
          "screen-home"
        );
        AudioManager?.click?.();
      }
    );

    dom.backButton?.addEventListener(
      "click",
      () => {
        if (state.busy) {
          return;
        }

        showChallenges();
        showScreen(
          "screen-challenges"
        );
      }
    );

    dom.undoButton?.addEventListener(
      "click",
      undo
    );
  }

  window.ChainGame = {
    state,
    init,
    showChallenges,
    selectChallenge,
    resetBoard
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      init();
      refreshIcons();
    }
  );
})();