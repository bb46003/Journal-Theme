import { JT } from "./config.mjs";
import { JournalThemeDialog } from "./journal-theme-dialog.mjs";
import { SocketHandler } from "./socketHandler.mjs";
import FontSize from "./font-size.mjs";

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
  registerHandlebarsHelpers();
  const myPackage = game.modules.get("journal-styler"); 
  myPackage.socketHandler = new SocketHandler();


});

Hooks.once("ready", async function() {
  
  const progressContainer = document.createElement("div");
  Object.assign(progressContainer.style, {
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "300px",
    height: "24px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid #999",
    borderRadius: "8px",
    zIndex: "99999",
    backdropFilter: "blur(4px)",
    overflow: "hidden",
  });


  const fillBar = document.createElement("div");
  Object.assign(fillBar.style, {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, #002fffff, #28048bff)",
    transition: "width 0.3s ease",
  });
  const textOverlay = document.createElement("div");
  Object.assign(textOverlay.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px",
    fontFamily: "sans-serif",
    pointerEvents: "none",
    textShadow: "0 0 4px rgba(0,0,0,0.8)",
  });
  textOverlay.textContent = "Loading fonts...";


  progressContainer.appendChild(fillBar);
  progressContainer.appendChild(textOverlay);
  document.body.appendChild(progressContainer);

  const headerFont = Object.fromEntries(
    Object.entries(CONFIG.JT.JournalHeaderFont).sort(([a], [b]) => a.localeCompare(b))
  );
  const fontNames = Object.keys(headerFont);
  const total = fontNames.length;
  let loaded = 0;

  for (const fontName of fontNames) {
    if (CONFIG.fontDefinitions && CONFIG.fontDefinitions[fontName]) {
      loaded++;
      const pct = Math.round((loaded / total) * 100);
      fillBar.style.width = `${pct}%`;
      textOverlay.textContent = `Loading fonts... (${loaded}/${total}) ${pct}%`;
      continue;
    }

    try {
      let cssUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
      if (fontName === "UnifrakturCook") {
        cssUrl = 'https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap';
      }

      const fontUrls = [];
      if (fontName !== "Big Noodle Titling") {
        const response = await fetch(cssUrl);
        const cssText = await response.text();
        const urlRegex = /url\(([^)]+\.woff2[^)]*)\)/g;
        let match;
        while ((match = urlRegex.exec(cssText)) !== null) {
          fontUrls.push(match[1].replace(/['"]/g, ''));
        }
      } else {
        fontUrls.push("modules/journal-styler/assets/font/big_noodle_titling.ttf");
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
      }
    } catch (err) {
      console.warn(`Failed to load font ${fontName}:`, err);
    }

   
    loaded++;
    const pct = Math.round((loaded / total) * 100);
    fillBar.style.width = `${pct}%`;
    textOverlay.textContent = `Loading fonts... (${loaded}/${total}) ${pct}%`;
  }

  
  fillBar.style.width = "100%";
  textOverlay.textContent = "All fonts loaded ✔";
  setTimeout(() => {
    progressContainer.style.transition = "opacity 0.6s ease";
    progressContainer.style.opacity = "0";
    setTimeout(() => progressContainer.remove(), 600);
  }, 800);
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
        element.style.setProperty("font-family", headerFont[flagHeaderFont], "important");
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
}

Hooks.on("createProseMirrorEditor", (_uuid, plugins, _options) => {
  const Menu = FontSize.prosemirror.FontSizeProseMirrorMenu;
  const { defaultSchema } = foundry.prosemirror;
  const options = plugins.menu.options;
  plugins.menu = Menu.build(defaultSchema, options);
});

