(() => {
  "use strict";

  const APP_VERSION = "1.0.0";

  const state = {
    initialized: false,
    currentScreen: "screen-home",
    soundEnabled: true,
    language: "zh-TW"
  };

  const dom = {};

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return [...document.querySelectorAll(selector)];
  }

  function cacheDOM() {
    dom.screens = $all(".screen");

    dom.home = $("#screen-home");
    dom.challenges = $("#screen-challenges");
    dom.game = $("#screen-game");
    dom.result = $("#screen-result");

    dom.startButton = $("#start-button");
    dom.continueButton = $("#continue-button");
    dom.endButton = $("#end-button");
    dom.backButton = $("#back-button");

    dom.undoButton = $("#undo-button");

    dom.soundButton = $("#sound-button");
    dom.languageButton = $("#language-button");

    dom.languageMenu = $("#language-menu");

    dom.toast = $("#toast");

    dom.appVersion = $("#app-version");

    dom.challengeGrid = $("#challenge-grid");

    dom.gameRound = $("#round-number");
    dom.gameStars = $("#game-stars");

    dom.resultScore = $("#result-score");
    dom.resultDifficulty =
      $("#result-difficulty");
  }

  /*
   * ---------------------------------------------------------
   * INITIALIZATION
   * ---------------------------------------------------------
   */

  async function init() {
    if (state.initialized) {
      return;
    }

    cacheDOM();

    state.language =
      localStorage.getItem(
        "chain-language"
      ) || detectLanguage();

    state.soundEnabled =
      localStorage.getItem(
        "chain-sound"
      ) !== "false";

    await initializeI18n();

    initializeAudio();

    initializeGame();

    bindEvents();

    updateSoundUI();

    updateLanguageUI();

    updateVersion();

    refreshIcons();

    state.initialized = true;

    console.log(
      `[Chain] initialized v${APP_VERSION}`
    );
  }

  /*
   * ---------------------------------------------------------
   * I18N
   * ---------------------------------------------------------
   */

  async function initializeI18n() {
    /*
     * i18next is loaded from CDN in index.html.
     * We intentionally keep translation logic centralized here
     * instead of writing translations button-by-button.
     */

    if (
      typeof window.i18next ===
      "undefined"
    ) {
      console.warn(
        "[Chain] i18next is not loaded."
      );

      return;
    }

    if (
      typeof window.i18next.init !==
      "function"
    ) {
      return;
    }

    /*
     * If i18n.js already initialized i18next,
     * don't initialize it a second time.
     */
    if (
      window.i18next.isInitialized
    ) {
      applyTranslations();
      return;
    }

    /*
     * i18n.js is responsible for loading
     * the actual locale resources.
     */
    if (
      typeof window.ChainI18n !==
      "undefined" &&
      typeof window.ChainI18n.init ===
      "function"
    ) {
      try {
        await window.ChainI18n.init(
          state.language
        );

        applyTranslations();
        return;
      } catch (error) {
        console.warn(
          "[Chain] ChainI18n initialization failed.",
          error
        );
      }
    }

    /*
     * Final fallback:
     * initialize i18next with the locale
     * already available in the page.
     */
    try {
      await window.i18next.init({
        lng: state.language,
        fallbackLng: "en",
        interpolation: {
          escapeValue: false
        }
      });

      applyTranslations();
    } catch (error) {
      console.warn(
        "[Chain] i18next initialization failed.",
        error
      );
    }
  }

  function applyTranslations() {
    if (
      typeof window.i18next ===
      "undefined"
    ) {
      return;
    }

    $all("[data-i18n]").forEach(
      element => {
        const key =
          element.dataset.i18n;

        if (!key) {
          return;
        }

        const translated =
          window.i18next.t(key);

        if (
          translated &&
          translated !== key
        ) {
          element.textContent =
            translated;
        }
      }
    );

    $all("[data-i18n-aria]").forEach(
      element => {
        const key =
          element.dataset.i18nAria;

        if (!key) {
          return;
        }

        element.setAttribute(
          "aria-label",
          window.i18next.t(key)
        );
      }
    );

    $all("[data-i18n-title]").forEach(
      element => {
        const key =
          element.dataset.i18nTitle;

        if (!key) {
          return;
        }

        element.setAttribute(
          "title",
          window.i18next.t(key)
        );
      }
    );

    document.documentElement.lang =
      state.language;

    refreshIcons();
  }

  function detectLanguage() {
    const browserLanguage =
      navigator.language ||
      "en";

    if (
      browserLanguage
        .toLowerCase()
        .startsWith("zh")
    ) {
      return "zh-TW";
    }

    if (
      browserLanguage
        .toLowerCase()
        .startsWith("ja")
    ) {
      return "ja";
    }

    return "en";
  }

  function changeLanguage(
    language
  ) {
    if (!language) {
      return;
    }

    state.language = language;

    localStorage.setItem(
      "chain-language",
      language
    );

    if (
      window.ChainI18n &&
      typeof window.ChainI18n.changeLanguage ===
      "function"
    ) {
      window.ChainI18n
        .changeLanguage(language)
        .then(() => {
          applyTranslations();
        })
        .catch(() => {
          applyTranslations();
        });

      return;
    }

    if (
      window.i18next &&
      typeof window.i18next.changeLanguage ===
      "function"
    ) {
      window.i18next
        .changeLanguage(language)
        .then(() => {
          applyTranslations();
        });
    }

    updateLanguageUI();
  }

  /*
   * ---------------------------------------------------------
   * AUDIO
   * ---------------------------------------------------------
   */

  function initializeAudio() {
    if (
      typeof window.AudioManager ===
      "undefined"
    ) {
      return;
    }

    if (
      typeof window.AudioManager.setEnabled ===
      "function"
    ) {
      window.AudioManager.setEnabled(
        state.soundEnabled
      );
    }
  }

  function playSound(
    method
  ) {
    if (!state.soundEnabled) {
      return;
    }

    if (
      typeof window.AudioManager ===
      "undefined"
    ) {
      return;
    }

    if (
      typeof window.AudioManager[method] ===
      "function"
    ) {
      window.AudioManager[method]();
    }
  }

  function toggleSound() {
    state.soundEnabled =
      !state.soundEnabled;

    localStorage.setItem(
      "chain-sound",
      String(state.soundEnabled)
    );

    if (
      window.AudioManager &&
      typeof window.AudioManager.setEnabled ===
      "function"
    ) {
      window.AudioManager.setEnabled(
        state.soundEnabled
      );
    }

    updateSoundUI();

    if (state.soundEnabled) {
      playSound("click");
    }
  }

  function updateSoundUI() {
    if (!dom.soundButton) {
      return;
    }

    const icon =
      state.soundEnabled
        ? "volume-2"
        : "volume-x";

    dom.soundButton.innerHTML =
      `<i data-lucide="${icon}"></i>`;

    dom.soundButton.setAttribute(
      "aria-pressed",
      String(state.soundEnabled)
    );

    dom.soundButton.dataset.i18nAria =
      state.soundEnabled
        ? "settings.soundOn"
        : "settings.soundOff";

    if (
      typeof window.i18next !==
      "undefined"
    ) {
      dom.soundButton.setAttribute(
        "aria-label",
        window.i18next.t(
          dom.soundButton.dataset
            .i18nAria
        )
      );
    }

    refreshIcons();
  }

  /*
   * ---------------------------------------------------------
   * GAME
   * ---------------------------------------------------------
   */

  function initializeGame() {
    if (
      typeof window.ChainGame ===
      "undefined"
    ) {
      console.warn(
        "[Chain] ChainGame was not found."
      );

      return;
    }

    if (
      typeof window.ChainGame.init ===
      "function"
    ) {
      /*
       * game.js also initializes itself on
       * DOMContentLoaded, so don't force a
       * second initialization.
       */
    }
  }

  function startGame() {
    playSound("click");

    state.currentScreen =
      "screen-challenges";

    if (
      window.ChainGame &&
      typeof window.ChainGame.showChallenges ===
      "function"
    ) {
      window.ChainGame.showChallenges();
    }

    showScreen(
      "screen-challenges"
    );
  }

  function continueGame() {
    playSound("click");

    if (
      window.ChainGame &&
      window.ChainGame.state
    ) {
      window.ChainGame.state.round++;
    }

    if (
      window.ChainGame &&
      typeof window.ChainGame.showChallenges ===
      "function"
    ) {
      window.ChainGame.showChallenges();
    }

    showScreen(
      "screen-challenges"
    );
  }

  function endGame() {
    playSound("click");

    if (
      window.ChainGame &&
      typeof window.ChainGame.resetBoard ===
      "function"
    ) {
      window.ChainGame.resetBoard();
    }

    state.currentScreen =
      "screen-home";

    showScreen(
      "screen-home"
    );
  }

  function goBackToChallenges() {
    playSound("click");

    if (
      window.ChainGame &&
      typeof window.ChainGame.showChallenges ===
      "function"
    ) {
      window.ChainGame.showChallenges();
    }

    showScreen(
      "screen-challenges"
    );
  }

  /*
   * ---------------------------------------------------------
   * SCREEN MANAGEMENT
   * ---------------------------------------------------------
   */

  function showScreen(
    screenId
  ) {
    if (!screenId) {
      return;
    }

    const target =
      document.getElementById(
        screenId
      );

    if (!target) {
      console.warn(
        `[Chain] Screen not found: ${screenId}`
      );

      return;
    }

    const previous =
      document.querySelector(
        ".screen.active"
      );

    if (
      previous === target
    ) {
      state.currentScreen =
        screenId;

      return;
    }

    /*
     * If GSAP exists, use a small transition.
     * Otherwise the CSS active state handles it.
     */
    if (
      typeof window.gsap !==
        "undefined"
    ) {
      const screens =
        $all(".screen");

      screens.forEach(
        screen => {
          if (
            screen === target
          ) {
            return;
          }

          screen.classList.remove(
            "active"
          );
        }
      );

      target.classList.add(
        "active"
      );

      window.gsap.fromTo(
        target,
        {
          opacity: 0,
          y: 8
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.22,
          ease: "power2.out"
        }
      );
    } else {
      dom.screens.forEach(
        screen => {
          screen.classList.toggle(
            "active",
            screen === target
          );
        }
      );
    }

    state.currentScreen =
      screenId;

    refreshIcons();
  }

  /*
   * ---------------------------------------------------------
   * LANGUAGE MENU
   * ---------------------------------------------------------
   */

  function toggleLanguageMenu() {
    if (!dom.languageMenu) {
      return;
    }

    const isOpen =
      dom.languageMenu.classList
        .contains("open");

    dom.languageMenu.classList.toggle(
      "open",
      !isOpen
    );

    if (dom.languageButton) {
      dom.languageButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );
    }
  }

  function closeLanguageMenu() {
    if (!dom.languageMenu) {
      return;
    }

    dom.languageMenu.classList.remove(
      "open"
    );

    if (dom.languageButton) {
      dom.languageButton.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }

  function updateLanguageUI() {
    $all(
      "[data-language]"
    ).forEach(
      element => {
        const language =
          element.dataset.language;

        element.classList.toggle(
          "active",
          language ===
            state.language
        );

        element.setAttribute(
          "aria-selected",
          String(
            language ===
              state.language
          )
        );
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * EVENTS
   * ---------------------------------------------------------
   */

  function bindEvents() {
    dom.startButton?.addEventListener(
      "click",
      startGame
    );

    dom.continueButton?.addEventListener(
      "click",
      continueGame
    );

    dom.endButton?.addEventListener(
      "click",
      endGame
    );

    dom.backButton?.addEventListener(
      "click",
      goBackToChallenges
    );

    dom.soundButton?.addEventListener(
      "click",
      toggleSound
    );

    dom.languageButton?.addEventListener(
      "click",
      event => {
        event.stopPropagation();
        toggleLanguageMenu();
      }
    );

    $all(
      "[data-language]"
    ).forEach(
      element => {
        element.addEventListener(
          "click",
          () => {
            changeLanguage(
              element.dataset.language
            );

            closeLanguageMenu();

            playSound("click");
          }
        );
      }
    );

    document.addEventListener(
      "click",
      event => {
        if (
          !dom.languageMenu ||
          !dom.languageButton
        ) {
          return;
        }

        if (
          dom.languageMenu.contains(
            event.target
          ) ||
          dom.languageButton.contains(
            event.target
          )
        ) {
          return;
        }

        closeLanguageMenu();
      }
    );

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          closeLanguageMenu();
        }
      }
    );

    /*
     * Allow keyboard navigation
     * for the game-level undo action.
     */
    document.addEventListener(
      "keydown",
      event => {
        const modifier =
          event.ctrlKey ||
          event.metaKey;

        if (
          modifier &&
          event.key.toLowerCase() ===
            "z"
        ) {
          if (
            state.currentScreen ===
            "screen-game"
          ) {
            event.preventDefault();

            dom.undoButton?.click();
          }
        }
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * ICONS
   * ---------------------------------------------------------
   */

  function refreshIcons() {
    if (
      typeof window.lucide ===
        "undefined"
    ) {
      return;
    }

    if (
      typeof window.lucide.createIcons !==
      "function"
    ) {
      return;
    }

    /*
     * Important:
     *
     * We DO NOT use:
     *
     *   data-lucide="shape"
     *
     * because "shape" is not a valid Lucide
     * icon name in the loaded icon set.
     *
     * The actual UI uses valid icons such as:
     * arrow-up-right
     * volume-2
     * volume-x
     * undo-2
     * settings
     * chevron-right
     */
    try {
      window.lucide.createIcons();
    } catch (error) {
      console.warn(
        "[Chain] Lucide initialization failed.",
        error
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * VERSION
   * ---------------------------------------------------------
   */

  function updateVersion() {
    if (!dom.appVersion) {
      return;
    }

    dom.appVersion.textContent =
      `v${APP_VERSION}`;
  }

  /*
   * ---------------------------------------------------------
   * PUBLIC API
   * ---------------------------------------------------------
   */

  window.ChainApp = {
    init,
    showScreen,
    startGame,
    continueGame,
    endGame,
    toggleSound,
    changeLanguage,
    refreshIcons,
    state
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      init();
    }
  );
})();