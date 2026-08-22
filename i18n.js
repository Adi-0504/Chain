const I18N = {
  supportedLanguages: ["zh-TW", "en"],
  defaultLanguage: "zh-TW"
};

async function initI18n() {
  const savedLanguage =
    localStorage.getItem("chain-language");

  const browserLanguage =
    navigator.language?.toLowerCase().startsWith("en")
      ? "en"
      : "zh-TW";

  const language =
    savedLanguage ||
    browserLanguage ||
    I18N.defaultLanguage;

  await i18next
    .use(i18nextHttpBackend)
    .init({
      lng: language,
      fallbackLng: I18N.defaultLanguage,

      supportedLngs:
        I18N.supportedLanguages,

      backend: {
        loadPath: "./locales/{{lng}}.json"
      },

      interpolation: {
        escapeValue: false
      },

      returnEmptyString: false
    });

  document.documentElement.lang =
    i18next.language === "en"
      ? "en"
      : "zh-Hant";

  translatePage();
}

function translatePage(root = document) {
  root
    .querySelectorAll("[data-i18n]")
    .forEach(element => {
      const key =
        element.dataset.i18n;

      element.textContent =
        i18next.t(key);
    });

  root
    .querySelectorAll("[data-tooltip]")
    .forEach(element => {
      element.title =
        i18next.t(
          element.dataset.tooltip
        );
    });

  document.title =
    i18next.t("app.title");
}

async function changeLanguage(language) {
  if (
    !I18N.supportedLanguages.includes(
      language
    )
  ) {
    return;
  }

  await i18next.changeLanguage(language);

  localStorage.setItem(
    "chain-language",
    language
  );

  document.documentElement.lang =
    language === "en"
      ? "en"
      : "zh-Hant";

  translatePage();

  if (window.ChainApp) {
    window.ChainApp.refreshDynamicText();
  }
}

function toggleLanguage() {
  const next =
    i18next.language === "zh-TW"
      ? "en"
      : "zh-TW";

  changeLanguage(next);
}