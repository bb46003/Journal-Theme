import { JT } from "./config.mjs";
import { JournalThemeDialog } from "./jurnal-theme-dialog.mjs";

Hooks.once("init", async function () {
  CONFIG.JT = JT;
  game.settings.register("journal-theme", "minOwnershipLevel", {
    name: "JT.SETTING.MinOwnership", // left-hand label
    hint: "JT.SETTING.MinOwnershipHint", // subtext hint
    scope: "world", // global for all users
    config: true, // show in Module Settings
    type: Number, // stored as number
    choices: {
      1: "Limited", // user-friendly label
      2: "Observer",
      3: "Owner",
    },
    default: 3, // default = Owner
  });
  // Register the stored default theme for GM
  game.settings.register("journal-theme", "GMdefoultTheme", {
    scope: "world",
    config: false,
    default: {},
    type: Object,
  });

  // Register menu entry (button) in the Settings UI
  game.settings.registerMenu("journal-theme", "themeMenu", {
    name: "JT.MENU.ThemeConfig", // shown as the left label
    label: "JT.MENU.OpenDialog", // the button text
    hint: "JT.MENU.ThemeConfigHint", // subtext hint
    icon: "fas fa-palette", // small icon on the button
    type: JournalThemeDialog, // this is your dialog class
    restricted: true, // true = GM only, false = everyone
  });
});

Hooks.on("renderJournalEntrySheet", (html) => {
  let element;
  let uuid;
  if (game.release.generation < 13) {
    element = html[0];
    uuid = html.document.uuid;
  } else {
    element = html.element;
    uuid = html.document.uuid;
  }
  const userID = game.user.id;
  const ownerShipSettings = game.settings.get(
    "journal-theme",
    "minOwnershipLevel",
  );
  const journalOwnerShip = html.document.ownership[userID];
  if (ownerShipSettings === journalOwnerShip) {
    const header = element.querySelector(".window-header");
    const bbuttenexist = element.querySelector(
      ".header-control.icon.fa-solid.fa-palette",
    );
    if (bbuttenexist === null) {
      const title = header.querySelector("h1");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("header-control", "icon", "fa-solid", "fa-palette");
      btn.dataset.tooltip = game.i18n.localize("JT.JURNAL.ThemeTooltip");
      title.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const data = { element: element, uuid: uuid };
        const dialog = new JournalThemeDialog(data);
        dialog.render(true);
      });
    }
  }
  const gmDefault = game.settings.get("journal-theme", "GMdefoultTheme") || {};
  const jtFlags = html.document?.flags?.JT || {};
  const flags = jtFlags[userID] ?? jtFlags["default"] ?? {};
  const flagTheme = flags.theme ?? gmDefault.theme;
  const flagHeaderFont = flags.headerFont ?? gmDefault.headerFont;
  const flagBodyFont = flags.bodyFont ?? gmDefault.bodyFont;
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
  if (flagBodyFont !== undefined) {
    const pages = element.querySelectorAll(".journal-entry-pages");
    pages.forEach((page) => {
      page.style.fontFamily = fonts[flagBodyFont];
    });
  }
  if (flagHeaderFont !== undefined) {
    const elements = element.querySelectorAll(
      ".window-title, .title, .sidebar.journal-sidebar.flexcol, .page-heading, .journal-page-header h1",
    );
    elements.forEach((element) => {
      if (flagHeaderFont !== "") {
        // set the font with !important
        element.style.setProperty("font-family", flagHeaderFont, "important");
      } else {
        // remove any previously set inline font
        element.style.removeProperty("font-family");
      }
    });
  }
  if (flagTheme !== undefined) {
    //apply Theme
    element.className = `application sheet journal-sheet journal-entry expanded ${flagTheme}`;
  }
});
