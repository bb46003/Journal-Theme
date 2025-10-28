import { JT } from "./config.mjs";
import { JournalThemeDialog } from "./journal-theme-dialog.mjs";
import { SocketHandler } from "./socketHandler.mjs";

Hooks.once("init", async function () {
  CONFIG.JT = JT;
  game.settings.register("journal-styler", "minOwnershipLevel", {
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
  game.settings.register("journal-styler", "GMdefoultTheme", {
    scope: "world",
    config: false,
    default: {},
    type: Object,
  });

  // Register menu entry (button) in the Settings UI
  game.settings.registerMenu("journal-styler", "themeMenu", {
    name: "JT.MENU.ThemeConfig", // shown as the left label
    label: "JT.MENU.OpenDialog", // the button text
    hint: "JT.MENU.ThemeConfigHint", // subtext hint
    icon: "fas fa-palette", // small icon on the button
    type: JournalThemeDialog, // this is your dialog class
    restricted: true, // true = GM only, false = everyone
  });
  registerHandlebarsHelpers();
  const myPackage = game.modules.get("journal-styler"); // or just game.system if you're a system
  myPackage.socketHandler = new SocketHandler();
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
    "journal-styler",
    "minOwnershipLevel",
  );
   const headerFont = CONFIG.JT.JournalHeaderFont;
  const journalOwnerShip = html.document.ownership[userID];
  if (ownerShipSettings <= journalOwnerShip) {
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
  const gmDefault = game.settings.get("journal-styler", "GMdefoultTheme") || {};
  const jtFlags = html.document?.flags?.JT || {};
  const flags = jtFlags[userID] ?? jtFlags["default"] ?? {};
  const flagTheme = flags.theme ?? gmDefault.theme;
  const flagHeaderFont = flags.headerFont ?? gmDefault.headerFont;
  const flagBodyFont = flags.bodyFont ?? gmDefault.bodyFont;

  if (flagBodyFont !== "") {
    const pages = element.querySelectorAll(".journal-entry-pages");
    pages.forEach((page) => {
      page.style.fontFamily = headerFont[flagBodyFont];
    });
  }
  else{
    const pages = element.querySelectorAll(".journal-entry-pages");
    pages.forEach((page) => {
      page.style.removeProperty("font-family");
    });
  }
  if (flagHeaderFont !== undefined) {
    const elements = element.querySelectorAll(
      `.window-title, .title, .sidebar.journal-sidebar.flexcol, .page-heading, .journal-page-header h1, text level1 page active, [data-anchor^="header-"],.heading-link, .heading `,
    );
    elements.forEach((element) => {
      if (flagHeaderFont !== "") {
        // set the font with !important
        element.style.setProperty("font-family", headerFont[flagHeaderFont], "important");
      } else {
        // remove any previously set inline font
        
      }
    });
  }
  if (flagTheme !== undefined) {
    //apply Theme
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
}
Hooks.once("setup", () => {
  const modulePathPart = "modules/journal-styler";

  function registerFontsFromSheet(sheet) {
    try {
      const rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];
      rules.forEach(rule => {
        // Only CSSFontFaceRule matters
        if (rule instanceof CSSFontFaceRule) {
          const fontName = rule.style.getPropertyValue("font-family")?.replace(/["']/g, "").trim();
          if (!fontName) return;

          // Ensure at least one valid weight/style
          const weight = rule.style.getPropertyValue("font-weight") || "400";
          const style = rule.style.getPropertyValue("font-style") || "normal";

          if (!CONFIG.fontDefinitions[fontName]) {
            CONFIG.fontDefinitions[fontName] = {
              editor: true,
              fonts: [{ weight, style }]
            };
          } else {
            // Avoid duplicates
            const exists = CONFIG.fontDefinitions[fontName].fonts.some(f => f.weight === weight && f.style === style);
            if (!exists) CONFIG.fontDefinitions[fontName].fonts.push({ weight, style });

            // Ensure fonts array is never empty
            if (CONFIG.fontDefinitions[fontName].fonts.length === 0) {
              CONFIG.fontDefinitions[fontName].fonts.push({ weight, style });
            }
          }

        // Follow @import rules if they are accessible
        } else if (rule instanceof CSSImportRule && rule.styleSheet) {
          try {
            if (rule.styleSheet.cssRules) registerFontsFromSheet(rule.styleSheet);
          } catch (_) {
            // Ignore cross-origin imports (like Google Fonts)
          }
        }
      });
    } catch (err) {
      // Ignore sheets we cannot read (cross-origin)
    }
  }

  // Loop over all stylesheets
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      // Inline or module sheet
      if (sheet.href === null || (sheet.href && sheet.href.includes(modulePathPart))) {
        registerFontsFromSheet(sheet);

      } else {
        // External sheet: check its rules for @import pointing to module
        const rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];
        rules.forEach(rule => {
          if (rule.href && rule.href.includes(modulePathPart)) {
            registerFontsFromSheet(sheet);
          }
        });
      }
    } catch (err) {
      console.warn("Skipping inaccessible stylesheet:", sheet.href);
    }
  });
});


