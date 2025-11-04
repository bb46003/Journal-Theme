export default async function addFonts() {
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
  const headerFont = Object.fromEntries(Object.entries(CONFIG.JT.JournalHeaderFont || {}).sort(([a], [b]) => a.localeCompare(b)));
  const addedFonts = Object.fromEntries(Object.entries(game.settings.get("journal-styler", "addedFonts") || {}).sort(([a], [b]) => a.localeCompare(b)));
  const fontEntries = [...Object.keys(headerFont).map((name) => ({ name, type: "header" })), ...Object.entries(addedFonts).map(([name, font]) => ({ name, ...font }))];
  const total = fontEntries.length;
  let loaded = 0;
  for (const font of fontEntries) {
    try {
      if (CONFIG.fontDefinitions && CONFIG.fontDefinitions[font.name]) {
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        fillBar.style.width = `${pct}%`;
        textOverlay.textContent = `Loading fonts... (${loaded}/${total}) ${pct}%`;
        continue;
      }
      const fontUrls = [];
      if (font.type === "google") {
        let cssUrl;
        if (font.url.startsWith("@import")) {
          const match = font.url.match(/url\(([^)]+)\)/);
          if (match) cssUrl = match[1].replace(/['"]/g, "");
        } else {
          cssUrl = font.url;
        }
        if (cssUrl) {
          const response = await fetch(cssUrl);
          const cssText = await response.text();
          const urlRegex = /url\(([^)]+\.woff2[^)]*)\)/g;
          let match;
          while ((match = urlRegex.exec(cssText)) !== null) {
            fontUrls.push(match[1].replace(/['"]/g, ""));
          }
        }
      } else if (font.type === "local") {
        fontUrls.push(font.path);
      } else {
        let cssUrl = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, "+")}&display=swap`;
        if (font.name === "UnifrakturCook") {
          cssUrl = "https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap";
        }
        if (font.name === "Big Noodle Titling") {
          fontUrls.push("modules/journal-styler/assets/font/big_noodle_titling.ttf");
        } else {
          const response = await fetch(cssUrl);
          const cssText = await response.text();
          const urlRegex = /url\(([^)]+\.woff2[^)]*)\)/g;
          let match;
          while ((match = urlRegex.exec(cssText)) !== null) {
            fontUrls.push(match[1].replace(/['"]/g, ""));
          }
        }
      }
      if (fontUrls.length > 0) {
        await foundry.applications.settings.menus.FontConfig.loadFont(font.name, {
          editor: true,
          fonts: fontUrls.map((url) => ({ urls: [url], weight: "400", style: "normal" })),
        });
      }
    } catch (err) {
      console.warn(`Failed to load font ${font.name}:`, err);
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
    setTimeout(() => progressContainer.remove(), 100);
  }, 600);
}
