import addFonts from "./adding-font.mjs";
const { api, sheets } = foundry.applications;

export class OwnFontsDialog extends api.HandlebarsApplicationMixin(api.Application) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["standard-form"],
    actions: {
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

    form: {
      closeOnSubmit: true,
      handler: OwnFontsDialog.#onSubmit,
    },
    window: { title: "JT.OWNFONT.title" },
  };
  static PARTS = {
    config: {
      template: "modules/journal-styler/templates/own-font.hbs",
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext() {
    const storedFonts = game.settings.get("journal-styler", "addedFonts") || {};
    const context = {};
    context.fonts = Object.keys(storedFonts).length > 0 ? Object.fromEntries(Object.entries(storedFonts).sort(([a], [b]) => a.localeCompare(b))) : {};
    context.buttons = [{ type: "submit", icon: "fa-solid fa-save", label: "Save Changes" }];
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

  static async #onSubmit(event, form, formData) {
    let googleFontsName = formData.object["google-name"];
    if (!Array.isArray(googleFontsName)) googleFontsName = [googleFontsName];
    let googleFontsURL = formData.object["google-url"];
    if (!Array.isArray(googleFontsURL)) googleFontsURL = [googleFontsURL];
    let localFontsName = formData.object["local-name"];
    if (!Array.isArray(localFontsName)) localFontsName = [localFontsName];
    let localFontsURL = formData.object["local-path"];
    if (!Array.isArray(localFontsURL)) localFontsURL = [localFontsURL];
    let fonts = game.settings.get("journal-styler", "addedFonts");
    googleFontsURL.forEach((url, index) => {
      if (url && googleFontsName[index]) {
        fonts.push({ fontType: "google", name: googleFontsName[index], url: url });
      }
    });
    localFontsURL.forEach((url, index) => {
      if (url && localFontsName[index]) {
        fonts.push({ fontType: "local", name: localFontsName[index], url: url });
      }
    });
    await game.settings.set("journal-styler", "addedFonts", fonts);
    this.close();
    await addFonts();
  }
}

async function save2(event, button) {
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
