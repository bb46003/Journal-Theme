const { api, sheets } = foundry.applications;

export class JournalThemeDialog extends api.HandlebarsApplicationMixin(api.Application) {
  static DEFAULT_OPTIONS = {
    actions: {
      applyTheme: JournalThemeDialog.#applyTheme,
    },
    position: {
      width: 550,
      height: "auto",
    },
    window: { title: "JT.JOURNAL.title" },
  };
  static PARTS = {
    main: {
      id: "main",
      template: "modules/journal-styler/templates/jourmal-theme.hbs",
    },
  };

  async _prepareContext() {
    const context = {};
    const userID = game.user.id;
    const journalUuid = this.options.uuid;
    const journalEntry = await fromUuid(journalUuid);
    let ownership = journalEntry?.ownership[userID];
    if (ownership === undefined && game.user.isGM) {
      ownership = 3;
    }
    const headerFont = Object.keys(CONFIG.JT?.JournalHeaderFont || {});
    const addedFonts = Object.keys(game.settings.get("journal-styler", "addedFonts") || {});
    const allFontNames = [...new Set([...headerFont, ...addedFonts])].sort((a, b) => a.localeCompare(b));
    const allFontsObj = Object.fromEntries(allFontNames.map((name) => [name, name]));
    const gmDefault = game.settings.get("journal-styler", "GMdefoultTheme") || {};
    const jtFlags = journalEntry?.flags?.JT || {};
    const flags = jtFlags[userID] ?? jtFlags["default"] ?? {};
    const flagTheme = flags.theme ?? gmDefault.theme;
    const flagHeaderFont = flags.headerFont ?? gmDefault.headerFont;
    const flagBodyFont = flags.bodyFont ?? gmDefault.bodyFont;
    context.listtheme = CONFIG.JT.sheetTheme;
    context.headerFont = allFontsObj;
    context.textFont = allFontsObj;
    context.selectedTheme = flagTheme;
    context.selectedHederFont = flagHeaderFont;
    context.selectedBodyFont = flagBodyFont;
    context.ownership = ownership;
    return context;
  }

  static async #applyTheme() {
    const element = this.element;
    const journalUuid = this.options.uuid;
    const selectors = element.querySelectorAll("select");
    let userID = game.user.id;
    const newValues = {};
    selectors.forEach((select) => {
      const id = select.id;
      const value = select.value;
      newValues[id] = value;
    });
    const isGM = game.user.isGM;
    if (journalUuid !== undefined) {
      const journalEntry = await fromUuid(journalUuid);
      const updateData = {};
      if (isGM) {
        userID = "default";
      }
      Object.entries(newValues).forEach(([key, value]) => {
        updateData[`flags.JT.${userID}.${key}`] = value;
      });
      if (Object.keys(updateData).length > 0) {
        if (journalEntry.ownership[userID] < 3 && isGM === false) {
          game.modules.get("journal-styler").socketHandler.emit({
            type: "setFlag",
            journalUuid: journalUuid,
            updateData: updateData,
          });
        } else {
          await journalEntry.update(updateData);
        }
      }
    } else {
      if (Object.keys(newValues).length > 0) {
        const currentDefaults = game.settings.get("journal-styler", "GMdefoultTheme") || {};
        const merged = { ...currentDefaults, ...newValues };
        console.log(merged);
        await game.settings.set("journal-styler", "GMdefoultTheme", merged);
      }
    }
  }
}
