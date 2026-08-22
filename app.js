const App = {

  currentScreen:
    "homeScreen",

  selectedChallenge:
    null,

  init() {
    this.cache();

    this.bindEvents();

    this.showScreen(
      "homeScreen"
    );
  },

  cache() {
    this.screens = {
      home:
        document.getElementById(
          "homeScreen"
        ),

      challenge:
        document.getElementById(
          "challengeScreen"
        ),

      game:
        document.getElementById(
          "gameScreen"
        ),

      result:
        document.getElementById(
          "resultScreen"
        )
    };
  },

  bindEvents() {

    document
      .getElementById(
        "startButton"
      )
      .addEventListener(
        "click",
        () => {
          AudioManager.play(
            "click"
          );

          this.showChallengeScreen();
        }
      );

    document
      .getElementById(
        "languageButton"
      )
      .addEventListener(
        "click",
        () => {
          AudioManager.play(
            "click"
          );

          toggleLanguage();
        }
      );

    document
      .getElementById(
        "soundButton"
      )
      .addEventListener(
        "click",
        () => {
          const enabled =
            AudioManager.toggle();

          AudioManager.play(
            "click"
          );

          this.toast(
            i18next.t(
              enabled
                ? "settings.soundOn"
                : "settings.soundOff"
            )
          );

          this.updateSoundIcon();
        }
      );

    document
      .getElementById(
        "backHomeButton"
      )
      .addEventListener(
        "click",
        () =>
          this.showScreen(
            "homeScreen"
          )
      );

    document
      .getElementById(
        "gameBackButton"
      )
      .addEventListener(
        "click",
        () =>
          this.showChallengeScreen()
      );

    document
      .getElementById(
        "continueButton"
      )
      .addEventListener(
        "click",
        () => {
          this.showChallengeScreen();
        }
      );

    document
      .getElementById(
        "finishButton"
      )
      .addEventListener(
        "click",
        () => {
          this.showScreen(
            "homeScreen"
          );
        }
      );
  },

  showChallengeScreen() {
    this.renderChallenges();

    this.showScreen(
      "challengeScreen"
    );
  },

  renderChallenges() {
    const list =
      document.getElementById(
        "challengeList"
      );

    list.innerHTML = "";

    CHALLENGES.forEach(
      (challenge, index) => {

        const card =
          document.createElement(
            "article"
          );

        card.className =
          "challenge-card";

        card.innerHTML = `
          <div class="challenge-number">
            ${index + 1}
          </div>

          <div class="challenge-shape">
            ${this.createChallengePreview(
              challenge.shape.cells
            )}
          </div>

          <h3>
            ${i18next.t(
              "challenge.card.challenge",
              {
                number:
                  index + 1
              }
            )}
          </h3>

          <p>
            ${i18next.t(
              "challenge.card.pieces",
              {
                count:
                  challenge.shape
                    .cells.length
              }
            )}
          </p>

          <div class="stars">
            ${this.createStars(
              challenge.stars
            )}
          </div>
        `;

        card.addEventListener(
          "click",
          () => {
            AudioManager.play(
              "click"
            );

            this.startChallenge(
              challenge
            );
          }
        );

        list.appendChild(
          card
        );
      }
    );

    lucide.createIcons();

    ChainAnimation.challengeCards(
      list.querySelectorAll(
        ".challenge-card"
      )
    );
  },

  createChallengePreview(
    cells
  ) {
    const set =
      new Set(
        cells.map(
          ([x, y]) =>
            `${x},${y}`
        )
      );

    let html = "";

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
        html += `
          <div class="mini-cell ${
            set.has(`${x},${y}`)
              ? "active"
              : "empty"
          }"></div>
        `;
      }
    }

    return html;
  },

  createStars(count) {
    return Array
      .from(
        { length: 3 },
        (_, index) => `
          <i
            data-lucide="star"
            style="
              opacity:
                ${index < count ? 1 : .2};
            "
          ></i>
        `
      )
      .join("");
  },

  startChallenge(
    challenge
  ) {
    this.selectedChallenge =
      challenge;

    Game.start(
      challenge
    );

    this.showScreen(
      "gameScreen"
    );
  },

  showResult(score) {
    document.getElementById(
      "resultScore"
    ).textContent =
      score;

    document.getElementById(
      "resultTitle"
    ).textContent =
      i18next.t(
        "result.title"
      );

    document.getElementById(
      "resultDescription"
    ).textContent =
      i18next.t(
        "result.description"
      );

    this.showScreen(
      "resultScreen"
    );

    ChainAnimation.result();
  },

  showScreen(id) {
    Object.values(
      this.screens
    ).forEach(
      screen =>
        screen.classList.remove(
          "active"
        )
    );

    const target =
      document.getElementById(
        id
      );

    if (!target) {
      return;
    }

    target.classList.add(
      "active"
    );

    this.currentScreen =
      id;

    ChainAnimation.screenIn(
      target
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    lucide.createIcons();
  },

  refreshDynamicText() {
    if (
      this.currentScreen ===
      "challengeScreen"
    ) {
      this.renderChallenges();
    }

    if (
      this.currentScreen ===
      "gameScreen"
    ) {
      Game.updateUndo();
    }
  },

  updateSoundIcon() {
    const button =
      document.getElementById(
        "soundButton"
      );

    button.innerHTML =
      `<i data-lucide="${
        AudioManager.enabled
          ? "volume-2"
          : "volume-x"
      }"></i>`;

    lucide.createIcons();
  },

  toast(message) {
    const toast =
      document.getElementById(
        "toast"
      );

    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      this.toastTimer
    );

    this.toastTimer =
      setTimeout(
        () =>
          toast.classList.remove(
            "show"
          ),
        1600
      );
  }
};

window.ChainApp =
  App;

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await initI18n();

    AudioManager.init();

    Game.init();

    App.init();

    lucide.createIcons();

    App.updateSoundIcon();
  }
);