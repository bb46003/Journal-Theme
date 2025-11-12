import { JT } from "./module/config.mjs";
import { JournalThemeDialog } from "./module/journal-theme-dialog.mjs";
import { SocketHandler } from "./module/socketHandler.mjs";
import FontSize from "./module/font-size.mjs";
import { OwnFontsDialog } from "./module/own-fonts-dialog.mjs";
import addFonts from "./module/adding-font.mjs";

Hooks.once("init", async function () {
  CONFIG.JT = JT;
  game.settings.register("journal-styler", "minOwnershipLevel", {
    name: "JT.SETTING.MinOwnership",
    hint: "JT.SETTING.MinOwnershipHint",
    scope: "world",
    config: true,
    type: Number,
    choices: {
      1: "Limited",
      2: "Observer",
      3: "Owner",
    },
    default: 1,
  });

  game.settings.register("journal-styler", "GMdefoultTheme", {
    scope: "world",
    config: false,
    default: {},
    type: Object,
  });

  game.settings.registerMenu("journal-styler", "themeMenu", {
    name: "JT.MENU.ThemeConfig",
    label: "JT.MENU.OpenDialog",
    hint: "JT.MENU.ThemeConfigHint",
    icon: "fas fa-palette",
    type: JournalThemeDialog,
    restricted: true,
  });
  game.settings.registerMenu("journal-styler", "ownFonts", {
    name: "JT.MENU.addOwnFonts",
    label: "JT.MENU.OpenFontDialog",
    hint: "JT.MENU.ownFontsHint",
    icon: "fas fa-palette",
    type: OwnFontsDialog,
    restricted: true,
  });

  game.settings.register("journal-styler", "addedFonts", {
    scope: "world",
    config: false,
    default: {},
    type: Object,
  });

  registerHandlebarsHelpers();
  const myPackage = game.modules.get("journal-styler");
  myPackage.socketHandler = new SocketHandler();
});

Hooks.once("ready", async function () {
  await addFonts();
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
  const ownerShipSettings = game.settings.get("journal-styler", "minOwnershipLevel");
  const headerFont = Object.keys(CONFIG.JT?.JournalHeaderFont || {});
  const addedFonts = Object.keys(game.settings.get("journal-styler", "addedFonts") || {});
  const allFontNames = [...new Set([...headerFont, ...addedFonts])].sort((a, b) => a.localeCompare(b));
  const allFontsObj = Object.fromEntries(allFontNames.map((name) => [name, name]));
  const journalOwnerShip = html.document.ownership[userID];
  if (ownerShipSettings <= journalOwnerShip) {
    const header = element.querySelector(".window-header");
    const bbuttenexist = element.querySelector(".header-control.icon.fa-solid.fa-palette");
    if (bbuttenexist === null) {
      const title = header.querySelector("h1");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("header-control", "icon", "fa-solid", "fa-palette");
      btn.dataset.tooltip = game.i18n.localize("JT.JOURNAL.ThemeTooltip");
      title.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const data = { element: element, uuid: uuid };
        const dialog = new JournalThemeDialog(data);
        dialog.render(true);
      });
    }
  }
  const gmDefault = game.settings.get("journal-styler", "GMdefoultTheme") || {};
  const jtFlags = html.document?.flags?.JT || {};
  const flags = jtFlags[userID] ?? jtFlags["default"] ?? {};
  const flagTheme = flags.theme ?? gmDefault.theme;
  const flagHeaderFont = flags.headerFont ?? gmDefault.headerFont;
  const flagBodyFont = flags.bodyFont ?? gmDefault.bodyFont;

  if (flagBodyFont !== "") {
    const pages = element.querySelectorAll(".journal-entry-pages");
    pages.forEach((page) => {
      page.style.fontFamily = allFontsObj[flagBodyFont];
    });
  } else {
    const pages = element.querySelectorAll(".journal-entry-pages");
    pages.forEach((page) => {
      page.style.removeProperty("font-family");
    });
  }
  if (flagHeaderFont !== undefined) {
    const elements = element.querySelectorAll(`.window-title, .title, .sidebar.journal-sidebar.flexcol, .page-heading, .journal-page-header h1, text level1 page active, [data-anchor^="header-"],.heading-link, .heading `);
    elements.forEach((element) => {
      if (flagHeaderFont !== "") {
        element.style.setProperty("font-family", allFontsObj[flagHeaderFont], "important");
      }
    });
  }
  if (flagTheme !== undefined) {
    element.className = `application sheet journal-sheet journal-entry expanded ${flagTheme}`;
  }
});

function registerHandlebarsHelpers() {
  Handlebars.registerHelper({
    eq: (v1, v2) => v1 === v2,
    ne: (v1, v2) => v1 !== v2,
    lt: (v1, v2) => v1 < v2,
    gt: (v1, v2) => v1 > v2,
    lte: (v1, v2) => v1 <= v2,
    gte: (v1, v2) => v1 >= v2,
    and() {
      return Array.prototype.every.call(arguments, Boolean);
    },
    or() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
  });
  Handlebars.registerHelper("length", function (value) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return 0;
  });
}

Hooks.on("createProseMirrorEditor", (_uuid, plugins, _options) => {
  console.log(plugins);
  const Menu = FontSize.prosemirror.FontSizeProseMirrorMenu;
  const { defaultSchema } = foundry.prosemirror;
  const options = plugins.menu.options;
  plugins.menu = Menu.build(defaultSchema, options);
});

Hooks.on("getProseMirrorMenuDropDowns", (_app, dropdowns) => {
  const dropdownArray = Array.isArray(dropdowns) ? dropdowns : Object.values(dropdowns);
  const formatDropdown = dropdownArray.find((d) => d.cssClass === "format");
  if (!formatDropdown) return;
  const headingsEntry = formatDropdown.entries[0];
  const headingsDropdown = {
    cssClass: "headings-only",
    entries: headingsEntry.children,
    title: headingsEntry.title || "Headings",
  };
  formatDropdown.entries.shift();
  dropdownArray.push(headingsDropdown);
  if (!Array.isArray(dropdowns)) {
    Object.assign(dropdowns, [headingsDropdown]);
  }
  const inline = formatDropdown.entries[1].children;
  const typesToExtract = ["italic", "bold", "underline"];
  const extractedItems = inline.filter((element) => typesToExtract.includes(element.action));
  formatDropdown.entries[1].children = inline.filter((element) => !typesToExtract.includes(element.action));
  const iconMap = {
    bold: "<i class='fa-solid fa-bold fa-fw'></i>",
    italic: "<i class='fa-solid fa-italic fa-fw'></i>",
    underline: "<i class='fa-solid fa-underline fa-fw'></i>",
  };
  const convertedItems = extractedItems.map((e) => ({
    action: e.action,
    cmd: e.cmd,
    cssClass: "pm-button",
    icon: iconMap[e.action] || "",
    scope: "",
    title: e.title,
  }));
  if (!_app.items) _app.items = [];
  _app.items.push(...convertedItems);
  _app.items.push(...extractedItems);
});
