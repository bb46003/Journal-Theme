import { JT } from "./config.mjs";
import { JournalThemeDialog } from "./journal-theme-dialog.mjs";
import { SocketHandler } from "./socketHandler.mjs";
import { i as inputRules, e as ellipsis, w as wrappingInputRule, t as textblockTypeInputRule, I as InputRule, k as keymap, u as undo, r as redo, a as undoInputRule, j as joinUp, b as joinDown, l as lift, s as selectParentNode, c as toggleMark, d as wrapInList, f as liftListItem, g as sinkListItem, h as setBlockType, m as chainCommands, n as exitCode, P as Plugin, o as wrapIn, p as deleteTable, q as addColumnAfter, v as addColumnBefore, x as deleteColumn, y as addRowAfter, z as addRowBefore, A as deleteRow, B as mergeCells, C as splitCell, T as TextSelection, D as liftTarget, E as autoJoin, R as ResolvedPos, F as tableNodes, S as Schema, G as splitListItem, H as DOMParser$2, J as DOMSerializer, K as Slice, L as tableEditing, M as columnResizing, N as history$1, O as gapCursor, Q as dropCursor, U as baseKeymap, V as AllSelection, W as EditorState, X as EditorView, Y as PluginKey, Z as Step, _ as index, $ as index$1, a0 as index$2, a1 as index$3, a2 as index$4, a3 as index$5, a4 as index$6, a5 as basicSetup, a6 as markdown, a7 as json, a8 as linter, a9 as javascript, aa as lintGutter, ab as esLint, ac as Linter, ad as html, ae as syntaxHighlighting, af as HighlightStyle, ag as tags, ah as markdownLanguage, ai as jsonLanguage, aj as javascriptLanguage, ak as htmlLanguage, al as jsonParseLinter, am as indentUnit, an as keymap$1, ao as indentWithTab, ap as EditorView$1, aq as Compartment, ar as EditorSelection } from '../../scripts/vendor.mjs';
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



    // Use Foundry's configuration system to extend the schema
    const originalConfigure = window.ProseMirror.defaultSchema.marks;
    const safeClone = structuredClone(JSON.parse(JSON.stringify(el)));
    console.log(safeClone)
    //fontSize.name = "fontSize",
    //fontSize.spec = {
//                 parseDOM: [{
 ////                   style: "font-size",
 //                   getAttrs: (value) => value ? { size: value } : false
//                  }],
 ///                 toDOM: (node) => ["span", { style: `font-size: ${node.attrs.size}` }, 0],
 //                 attrs : {size: { default: "10px" }}
  //              }
//    window.ProseMirror.defaultSchema.marks['fontSize']= fontSize;

  //  console.log(window.ProseMirror.defaultSchema.marks)
});


Hooks.once("prosemirrorSchema", (schema) => {
  schema.marks.fontSize = {
    attrs: {
      size: { default: null }
    },
    parseDOM: [{
      style: "font-size",
      getAttrs: value => ({ size: value })
    }],
    toDOM: mark => ["span", { style: `font-size: ${mark.attrs.size}` }, 0]
  };
});
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
  }
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




Hooks.on("getProseMirrorMenuDropDowns", function (_app, dropdowns) {
    const FONT_SIZES = [
        { size: 8, title: "8px" },
        { size: 9, title: "9px" },
        { size: 10, title: "10px" },
        { size: 11, title: "11px" },
        { size: 12, title: "12px" },
        { size: 14, title: "14px" },
        { size: 16, title: "16px" },
        { size: 18, title: "18px" },
        { size: 20, title: "20px" },
        { size: 22, title: "22px" },
        { size: 24, title: "24px" },
        { size: 26, title: "26px" },
        { size: 28, title: "28px" },
        { size: 32, title: "32px" },
        { size: 36, title: "36px" },
        { size: 40, title: "40px" },
        { size: 48, title: "48px" }
    ];

    const fontSizeButtons = FONT_SIZES.map(fontSize => ({
        action: `font-size-${fontSize.size}`,
        attrs: { size: fontSize.size },
        cmd: toggleMark(_app.schema.marks.fontSize, {size: fontSize.size}),
        mark: "fontSize", // Custom mark name
        title: fontSize.title,
        priority: 2,
    }));

    dropdowns["fontSize"] = {
        cssClass: "font-size-dropdown",
        entries: fontSizeButtons,
        icon: '<i class="fa fa-text-height"></i>',
        title: "Font Size"
    };

    function applyFontSize(size, state, dispatch) {
        const { schema, selection } = state;
        const { from, to } = selection;
        
        // Try to use existing font mark or create similar approach
        const markType = schema.marks.font || schema.marks.span;
        
        if (!markType) {
            console.warn("No suitable mark found for font size");
            return false;
        }
        
        const tr = state.tr;
        const fontSize = `${size}px`;
        
        // Remove existing font marks in selection
        tr.removeMark(from, to, markType);
        
        // Create mark with font size - similar to font family structure
        let mark;
        if (markType.name === 'fontSize') {
            // If using font mark (like font family does)
            mark = markType.create({ 
                size: fontSize,
                size: `font-size: ${fontSize}`
            });
        } else {
            // If using span mark as fallback
            mark = markType.create({ 
                size: `font-size: ${fontSize}` 
            });
        }
        
        if (!selection.empty) {
            tr.addMark(from, to, mark);
        } else {
            tr.addStoredMark(mark);
        }
        
        if (dispatch) {
            dispatch(tr);
            return true;
        }
        
        return false;
    }
});
