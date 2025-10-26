export class JournalThemeDialog extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      applyTheme: JournalThemeDialog.#applyTheme,
    },
    position: {
      width: 550,
      height: "auto",
    },
    template:
      "modules/journal-styler/jourmal-theme.hbs",
    window: { title: "JT.JURNAL.title" },
  };

  async _renderHTML() {
    console.log(this);
    const path = this.options.template;

    const fonts = {
      arial: "Arial",
      poppins: "Poppins",
      robotoMono: "Roboto Mono",
      tektur: "Tektur",
      josefinSans: "Josefin Sans",
      goldman: "Goldman",
      prompt: "Prompt",
      russoOne: "Russo One",
      righteous: "Righteous",
      quantico: "Quantico",
      secularOne: "Secular One",
    };
    const userID = game.user.id;
    const journalUuid = this.options.uuid;
    const journalEntry = await fromUuid(journalUuid);
    let ownership = journalEntry?.ownership[userID];
    if(ownership === undefined && game.user.isGM){
      ownership = 3;  
    }
    const headerFont = CONFIG.JT.JournalHeaderFont;
    const gmDefault =
      game.settings.get("journal-styler", "GMdefoultTheme") || {};
    const jtFlags = journalEntry?.flags?.JT || {};
    const flags = jtFlags[userID] ?? jtFlags["default"] ?? {};
    const flagTheme = flags.theme ?? gmDefault.theme;
    const flagHeaderFont = flags.headerFont ?? gmDefault.headerFont;
    const flagBodyFont = flags.bodyFont ?? gmDefault.bodyFont;
    const data = {
      listtheme: CONFIG.JT.sheetTheme, // or whatever list you have
      headerFont: headerFont, // header fonts
      textFont: fonts,
      selectedTheme: flagTheme,
      selectedHederFont: flagHeaderFont,
      selectedBodyFont: flagBodyFont, // body fonts
      ownership: ownership
    };

    let html;
    if (game.release.generation > 12) {
      html = foundry.applications.handlebars.renderTemplate(path, data);
    } else {
      html = renderTemplate(path, data);
    }

    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
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
        if(journalEntry.ownership[userID] < 3){
          game.modules.get("journal-styler").socketHandler.emit({
            type: "setFlag",
            journalUuid: journalUuid,
            updateData: updateData
          });

        }else{
          await journalEntry.update(updateData);
        }
      }
    } else {
      if (Object.keys(newValues).length > 0) {
        const currentDefaults =
          game.settings.get("journal-styler", "GMdefoultTheme") || {};
        const merged = { ...currentDefaults, ...newValues };
        await game.settings.set("journal-styler", "GMdefoultTheme", merged);
      }
    }
  }
}
