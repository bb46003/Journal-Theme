import addFonts from "./adding-font.mjs";

export class OwnFontsDialog extends foundry.applications.api.ApplicationV2 {
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
    template: "modules/journal-styler/templates/own-font.hbs",
    window: { title: "JT.OWNFONT.title" },
  };

  async _renderHTML() {
    const addedFonts = Object.fromEntries(Object.entries(game.settings.get("journal-styler", "addedFonts")).sort(([a], [b]) => a.localeCompare(b)));
    const path = this.options.template;
    const html = game.release.generation > 12 ? await foundry.applications.handlebars.renderTemplate(path, addedFonts) : await renderTemplate(path, addedFonts);
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
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
    delete fonts[name];
    await game.settings.set("journal-styler", "addedFonts", fonts);
    this.render(true);
  }

  static async #removeGoogleFont(event, button) {
    const name = button.closest("[data-name]")?.dataset.name;
    if (!name) return;
    const fonts = foundry.utils.duplicate(game.settings.get("journal-styler", "addedFonts"));
    delete fonts[name];
    await game.settings.set("journal-styler", "addedFonts", fonts);
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
    const fonts = {};
    html.querySelectorAll(".form-fields").forEach((entry) => {
      const googleNameInput = entry.querySelector("input[name='google-name']");
      const googleUrlInput = entry.querySelector("input[name='google-url']");
      if (googleNameInput && googleUrlInput) {
        const name = googleNameInput.value.trim();
        const url = googleUrlInput.value.trim();
        if (name && url) {
          fonts[name] = { type: "google", name, url };
        }
        return;
      }
      const localNameInput = entry.querySelector("input[name='local-name']");
      const localPathInput = entry.querySelector("input[name='local-path']");
      if (localNameInput && localPathInput) {
        const name = localNameInput.value.trim();
        const path = localPathInput.value.trim();
        if (name && path) {
          fonts[name] = { type: "local", name, path };
        }
      }
    });
    await game.settings.set("journal-styler", "addedFonts", fonts);
    this.close();
    await addFonts();
  }
}
