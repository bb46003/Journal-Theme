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


Hooks.once("ready", async function() {
      const headerFont = Object.fromEntries(
      Object.entries(CONFIG.JT.JournalHeaderFont).sort(([a], [b]) => a.localeCompare(b))    
    );
  const fontNames = Object.keys(headerFont);  
  for (const fontName of fontNames) {
    // Skip if font already exists in CONFIG.fontDefinitions
    if (CONFIG.fontDefinitions && CONFIG.fontDefinitions[fontName]) {
      continue;
    }
    
    try {
      let cssUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
      if(fontName === "UnifrakturCook"){
        cssUrl = 'https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap';
      }
     
      const response = await fetch(cssUrl);
      const cssText = await response.text();
      const fontUrls = [];
      const urlRegex = /url\(([^)]+\.woff2[^)]*)\)/g;
      let match;
      while ((match = urlRegex.exec(cssText)) !== null) {
        fontUrls.push(match[1].replace(/['"]/g, ''));
      }
      if (fontUrls.length > 0) {
        await foundry.applications.settings.menus.FontConfig.loadFont(fontName, {
          editor: true,
          fonts: [{
            urls: fontUrls,
            weight: "400",
            style: "normal"
          }]
        });
      } else {
        
      }
    } catch (err) {

    }

  }
  
});