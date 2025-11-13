import addFonts from "./adding-font.mjs";
const { api, sheets } = foundry.applications;

export class OwnFontsDialog extends api.HandlebarsApplicationMixin(api.Application) {
  static DEFAULT_OPTIONS = {
    actions: {
      save: OwnFontsDialog.#save,
      addLocalFont: OwnFontsDialog.#addLocalFont,
      addGoogleFont: OwnFontsDialog.#addGoogleFont,
      removeLocalFont: OwnFontsDialog.#removeLocalFont,
      removeGoogleFont: OwnFontsDialog.#removeGoogleFont,
      browse: OwnFontsDialog.#browseFile,
    },
    position: {
      width: 550,
      height: "auto",
    },

    window: { title: "JT.OWNFONT.title" },
  };
  static PARTS = {
    main: {
      id: "main",
      template: "modules/journal-styler/templates/own-font.hbs",
    },
  };

  async _prepareContext() {
    const storedFonts = game.settings.get("journal-styler", "addedFonts") || {};
    const context = {};
    context.fonts = Object.keys(storedFonts).length > 0 ? Object.fromEntries(Object.entries(storedFonts).sort(([a], [b]) => a.localeCompare(b))) : {};
    return context;
  }

  static #addGoogleFont(event, button) {
    const section = button.closest(".add-google-font");
    const addBtn = section.querySelector(".add-google-font-btn");
    const localizeFontName = game.i18n.localize("JT.OWNFONT.localName");
    const fontPath = game.i18n.localize("JT.OWNFONT.googleUrl");
    const container = document.createElement("div");
    container.classList.add("form-fields");
    container.innerHTML = `
    <label>${localizeFontName}</label>
    <input type="text" name="google-name" placeholder="e.g. Roboto">

    <label>${fontPath}/label>
    <input type="text" name="google-url" placeholder="https://fonts.googleapis.com/css2?family=Roboto">

    <button type="button" class="remove-google-field">
      <i class="fa-solid fa-trash"></i> Remove
    </button>
  `;

    addBtn.before(container);

    container.querySelector(".remove-google-field").addEventListener("click", () => {
      container.remove();
    });
  }

  static #addLocalFont(event, button) {
    const section = button.closest(".add-local-font");
    const addBtn = section.querySelector(".add-local-font-btn");
    const localizeFontName = game.i18n.localize("JT.OWNFONT.localName");
    const fontPath = game.i18n.localize("JT.OWNFONT.localPath");
    const container = document.createElement("div");
    container.classList.add("form-fields");
    container.innerHTML = `
    <label>${localizeFontName}</label>
    <input type="text" name="local-name" placeholder="e.g. MyLocalFont">

    <label>${fontPath}</label>
    <div class="file-picker">
      <input type="text" name="local-path" placeholder="modules/journal-styler/assets/fonts/MyFont.ttf">
      <button type="button" class="file-picker-btn" data-action="browse" data-type="font">
        <i class="fa-solid fa-folder-open"></i>
      </button>
    </div>

    <button type="button" class="remove-local-field">
      <i class="fa-solid fa-trash"></i> Remove
    </button>
  `;

    addBtn.before(container);

    container.querySelector(".remove-local-field").addEventListener("click", () => {
      container.remove();
    });
  }

  static async #removeLocalFont(event, button) {
    const name = button.closest("[data-name]")?.dataset.name;
    if (!name) return;
    const fonts = foundry.utils.duplicate(game.settings.get("journal-styler", "addedFonts"));
    const updatedFonts = fonts.filter((font) => font.name !== name);
    await game.settings.set("journal-styler", "addedFonts", updatedFonts);
    this.render(true);
  }

  static async #removeGoogleFont(event, button) {
    const name = button.closest("[data-name]")?.dataset.name;
    if (!name) return;
    const fonts = foundry.utils.duplicate(game.settings.get("journal-styler", "addedFonts"));
    const updatedFonts = fonts.filter((font) => font.name !== name);
    await game.settings.set("journal-styler", "addedFonts", updatedFonts);
    this.render(true);
  }

  static async #browseFile(event, button) {
    const html = event.currentTarget;
    const input = html.querySelector("input[name='local-path']");
    const fp = new FilePicker({
      type: "font",
      current: input.value || "modules/",
      callback: (path) => (input.value = path),
      top: this?.position?.top + 40,
      left: this?.position?.left + 10,
    });
    return fp.browse();
  }

  static async #save(event, button) {
    const html = event.currentTarget;
    const fonts = game.settings.get("journal-styler", "addedFonts");
    html.querySelectorAll(".form-fields").forEach((entry) => {
      const googleNameInput = entry.querySelector("input[name='google-name']");
      const googleUrlInput = entry.querySelector("input[name='google-url']");
      if (googleNameInput && googleUrlInput) {
        const name = googleNameInput.value.trim();
        const url = googleUrlInput.value.trim();
        if (name && url) {
          fonts.push({ fontType: "google", name: name, url: url });
        }
        return;
      }
      const localNameInput = entry.querySelector("input[name='local-name']");
      const localPathInput = entry.querySelector("input[name='local-path']");
      if (localNameInput && localPathInput) {
        const name = localNameInput.value.trim();
        const path = localPathInput.value.trim();
        if (name && path) {
          fonts.push({ fontType: "local", name: name, url: path });
        }
      }
    });
    await game.settings.set("journal-styler", "addedFonts", fonts);
    this.close();
    await addFonts();
  }
}
