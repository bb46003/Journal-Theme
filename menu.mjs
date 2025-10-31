import { modifyMark } from "./utility.mjs";
import FontSize from "./font-size.mjs";

export class FontSizeProseMirrorMenu extends foundry.prosemirror.ProseMirrorMenu {
  render() {
    super.render();
    this.#attachFontQuillDropdown();
    return this;
  }

  #attachFontQuillDropdown() {
    const menu = document.getElementById(this.id);
    if (!menu) return;
    FontSize.createItems(menu);
    this.#setCustomListeners(menu);
  }

  #setCustomListeners(menu) {
    menu.querySelectorAll("select[data-action=setFontSize]").forEach(select => {
      select.addEventListener("change", this.#onFontSizeChange.bind(this));
    });
  }

  #onFontSizeChange(event) {
    event.preventDefault();
    const selectedSize = event.currentTarget.value;
    if (!selectedSize) return;

    const { state, dispatch } = this.view;
    const { selection } = state;
    const markType = this.schema.marks.span;
    const _preserveAttr = this.#getPreserve(state, markType, selection);

    const spanStyle = Object.assign(document.createElement("span"), {
      style: _preserveAttr.style
    }).style;

    if (spanStyle["font-size"] === selectedSize) {
      spanStyle.removeProperty("font-size");
    } else {
      spanStyle.setProperty("font-size", selectedSize);
    }

    modifyMark(markType, state, dispatch, {
      _preserve: {
        ..._preserveAttr,
        style: spanStyle.cssText,
      },
    }, {
      includeWhitespace: false,
      modify: spanStyle.length >= 1,
    });
  }

  #getPreserve(state, markType, selection) {
    let _preserve = {};
    state.doc.nodesBetween(selection.from, selection.to, node => {
      const mark = node.marks.find(m => m.type.name === markType.name && m.attrs?._preserve);
      if (mark) {
        _preserve = mark.attrs._preserve;
        return false;
      }
    });
    return _preserve;
  }
}
