const AudioManager = {
  enabled:
    localStorage.getItem("chain-sound") !== "off",

  sounds: {},

  init() {
    this.sounds = {
      click:
        new Audio("./assets/audio/ui-click.mp3"),

      neutral:
        new Audio("./assets/audio/ui-error.mp3"),

      place:
        new Audio("./assets/audio/ui-place.mp3"),

      rotate:
        new Audio("./assets/audio/ui-switch.mp3"),

      success:
        new Audio("./assets/audio/ui-success.mp3"),

      complete:
        new Audio("./assets/audio/ui-complete.mp3")
    };

    Object.values(this.sounds)
      .forEach(audio => {
        audio.preload = "auto";
      });
  },

  play(name) {
    if (!this.enabled) {
      return;
    }

    const audio =
      this.sounds[name];

    if (!audio) {
      return;
    }

    audio.currentTime = 0;

    audio.play()
      .catch(() => {});
  },

  toggle() {
    this.enabled =
      !this.enabled;

    localStorage.setItem(
      "chain-sound",
      this.enabled
        ? "on"
        : "off"
    );

    return this.enabled;
  }
};