import { FontSizeProseMirrorMenu } from "./menu.mjs";

export default class FontSize {
  static SCOPES = foundry.prosemirror.ProseMirrorMenu._MENU_ITEM_SCOPES;
  static FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

  static get instance() {
    const module = game.modules.get("journal-styler");
    if (!module.FontSize) module.FontSize = new FontSize();
    return module.FontSize;
  }
  static prosemirror = { FontSizeProseMirrorMenu };
  static createItems(menu) {
    const li = document.createElement("li");
    li.classList.add(FontSize.SCOPES.TEXT);

    const select = document.createElement("select");
    select.classList.add("font-quill-select");
    select.dataset.action = "setFontSize";

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Font Size";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    for (const size of FontSize.FONT_SIZES) {
      const opt = document.createElement("option");
      opt.value = `${size}px`;
      opt.textContent = `${size}px`;
      select.appendChild(opt);
    }

    li.append(select);
    const fontLi = menu.querySelector("li.text:has(> button.pm-dropdown.fonts)");
    fontLi.insertAdjacentElement("afterend", li);
  }
}
