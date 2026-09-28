const GFUNCTION_CONFIG = {
  github: {
    owner: "maximo205416",
    repo: "GFunction-Lite",
    defaultBranch: "main",
    versionsPath: "",
    eegPath: "",
    betaPath: ""
  }
};

const stableContainer = document.getElementById("stable-container");
const betaContainer = document.getElementById("beta-container");
const eegContainer = document.getElementById("eeg-container");
const downloadModal = document.getElementById("download-modal");
const downloadModalMessage = document.getElementById("download-modal-message");
const downloadModalConfirm = document.getElementById("download-modal-confirm");
const downloadModalCancel = document.getElementById("download-modal-cancel");

let pendingDownloadAction = null;

const screens = {
  home: document.getElementById("home-screen"),
  downloads: document.getElementById("downloads-screen"),
  beta: document.getElementById("beta-screen"),
  eeg: document.getElementById("eeg-screen")
};

function getGithubConfig() {
  return GFUNCTION_CONFIG.github;
}

function isRepoConfigured() {
  const { owner, repo } = getGithubConfig();
  return Boolean(owner && repo && owner !== "YOUR_GITHUB_USER_OR_ORG");
}

function getRepoApiUrl() {
  const { owner, repo } = getGithubConfig();
  return `https://api.github.com/repos/${owner}/${repo}`;
}

function getRawUrl(filePath) {
  const { owner, repo, defaultBranch } = getGithubConfig();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`;
}

function setScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("active", key === name);
  });
}

function triggerForcedDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener noreferrer";
  link.target = "_self";
  link.style.display = "none";
  link.setAttribute("download", fileName || "download");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function directDownload(url, fileName) {
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Error al descargar: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerForcedDownload(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    return;
  } catch (error) {
    console.warn("No se pudo descargar como blob, usando fallback:", error);
  }

  const fallback = document.createElement("a");
  fallback.href = url;
  fallback.rel = "noopener noreferrer";
  fallback.target = "_self";
  fallback.style.display = "none";
  fallback.setAttribute("download", fileName || "download");
  document.body.appendChild(fallback);
  fallback.click();
  fallback.remove();
}

function renderEmpty(container, message) {
  const empty = document.createElement("div");
  empty.className = "empty-card";
  empty.textContent = message;
  container.innerHTML = "";
  container.appendChild(empty);
}

function openDownloadModal(file, onConfirm) {
  pendingDownloadAction = onConfirm;
  downloadModalMessage.textContent = `¿Quieres descargar ${file.name || "este archivo"}?`;
  downloadModal.classList.remove("hidden");
  downloadModal.setAttribute("aria-hidden", "false");
}

function closeDownloadModal() {
  pendingDownloadAction = null;
  downloadModal.classList.add("hidden");
  downloadModal.setAttribute("aria-hidden", "true");
}

function createDownloadButton(file) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "box start-btn fx-layer download-button";
  button.style.setProperty("--w", "100%");
  button.style.setProperty("--h", "52px");
  button.style.setProperty("--tr", "18%");

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = "Descargar";

  const btnIcon = document.createElement("span");
  btnIcon.className = "btn-icon";
  btnIcon.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "svg");
  svg.setAttribute("viewBox", "0 0 1024 1024");
  svg.setAttribute("version", "1.1");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M779.180132 473.232045 322.354755 16.406668c-21.413706-21.413706-56.121182-21.413706-77.534887 0-21.413706 21.413706-21.413706 56.122205 0 77.534887l418.057421 418.057421L244.819868 930.057421c-21.413706 21.413706-21.413706 56.122205 0 77.534887 10.706853 10.706853 24.759917 16.059767 38.767955 16.059767s28.061103-5.353938 38.767955-16.059767L779.180132 550.767955C800.593837 529.35425 800.593837 494.64575 779.180132 473.232045z");
  svg.appendChild(path);
  btnIcon.appendChild(svg);

  const circle = document.createElement("span");
  circle.className = "circle-overlay";
  circle.setAttribute("aria-hidden", "true");

  button.appendChild(text);
  button.appendChild(btnIcon);
  button.appendChild(circle);

  button.addEventListener("click", () => {
    openDownloadModal(file, async () => {
      if (file.download_url) {
        await directDownload(file.download_url || getRawUrl(file.path), file.name || "archivo");
        return;
      }

      if (file.path) {
        const { owner, repo, defaultBranch } = getGithubConfig();
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}?ref=${defaultBranch}`;
        const info = await fetchJson(apiUrl);
        const content = info.content || "";
        const binary = atob(content.replace(/\s/g, ""));
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        triggerForcedDownload(url, file.name || "download");
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    });
  });
  return button;
}


function parseVersionFile(fileName) {
  const cleaned = fileName.replace(/\.txt$/i, "");
  const match = cleaned.match(/GFunction-Lite[_\s]+V?(\d+\.\d+)(?:[_\s]+Beta(?:[_\s]*(\d+))?)?/i);

  if (!match) {
    return {
      kind: "stable",
      title: cleaned || "Versión"
    };
  }

  const [, version, betaNumber] = match;

  if (betaNumber) {
    return {
      kind: "beta",
      title: `V${version} Beta ${betaNumber}`
    };
  }

  if (/Beta/i.test(cleaned)) {
    return {
      kind: "beta",
      title: `V${version} Beta`
    };
  }

  return {
    kind: "stable",
    title: `V${version}`
  };
}

function getVersionNumber(fileName) {
  const match = fileName.match(/V?(\d+)\.(\d+)/i);
  if (!match) return -1;
  return Number(match[1]) + Number(match[2]) / 100;
}

function getLatestStableFile(files) {
  if (!files.length) return null;
  return [...files].sort((a, b) => getVersionNumber(b.name) - getVersionNumber(a.name))[0];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadLatestStable(downloadAll = false) {
  try {
    const rootFiles = await fetchRepoFiles(getGithubConfig().versionsPath || "");
    const stableFiles = classifyVersionFiles(rootFiles)
      .filter((file) => !/beta/i.test(file.name))
      .sort((a, b) => getVersionNumber(b.name) - getVersionNumber(a.name));

    if (!stableFiles.length) {
      setScreen("downloads");
      return;
    }

    const filesToDownload = downloadAll ? stableFiles : [getLatestStableFile(stableFiles)];

    for (const file of filesToDownload) {
      if (!file) continue;
      const link = file.download_url || getRawUrl(file.path);
      await directDownload(link, file.name || "GFunction-Lite-version.txt");
      await wait(400);
    }
  } catch (error) {
    console.warn("No se pudo descargar la versión solicitada:", error);
    setScreen("downloads");
  }
}

function renderStableCards(files) {
  stableContainer.innerHTML = "";

  if (!files.length) {
    renderEmpty(stableContainer, "No hay versiones publicadas oficialmente en GitHub.");
    return;
  }

  files.forEach((file) => {
    const card = document.createElement("article");
    card.className = "version-card";

    const top = document.createElement("div");
    top.className = "card-top";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Estable";

    const title = document.createElement("span");
    title.className = "card-title";
    title.textContent = parseVersionFile(file.name).title;

    top.appendChild(badge);
    top.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = file.path || "Versión oficial";

    card.appendChild(top);
    card.appendChild(meta);
    card.appendChild(createDownloadButton(file));
    stableContainer.appendChild(card);
  });
}

function renderBetaCards(files) {
  betaContainer.innerHTML = "";

  if (!files.length) {
    renderEmpty(betaContainer, "No hay Betas publicadas. La Beta 3 no aparecerá hasta que exista oficialmente en GitHub.");
    return;
  }

  files.forEach((file) => {
    const card = document.createElement("article");
    card.className = "version-card";

    const top = document.createElement("div");
    top.className = "card-top";

    const badge = document.createElement("span");
    badge.className = "badge beta";
    badge.textContent = "Beta";

    const title = document.createElement("span");
    title.className = "card-title";
    title.textContent = parseVersionFile(file.name).title;

    top.appendChild(badge);
    top.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = file.path || "Beta oficial";

    card.appendChild(top);
    card.appendChild(meta);
    card.appendChild(createDownloadButton(file));
    betaContainer.appendChild(card);
  });
}

function renderEegCards(files) {
  eegContainer.innerHTML = "";

  if (!files.length) {
    renderEmpty(eegContainer, "No hay archivos EEG publicados oficialmente en GitHub.");
    return;
  }

  files.forEach((file) => {
    const card = document.createElement("article");
    card.className = "eeg-card";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = file.name || "EEG";

    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = file.path || "Archivo EEG oficial";

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(createDownloadButton(file));
    eegContainer.appendChild(card);
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchRepoFiles(path = "") {
  if (!isRepoConfigured()) return [];

  const { owner, repo, defaultBranch } = getGithubConfig();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path || ""}?ref=${defaultBranch}`;

  try {
    const items = await fetchJson(url);
    if (!Array.isArray(items)) return [];

    return items.filter((item) => item.type === "file").map((item) => ({
      ...item,
      download_url: item.download_url || getRawUrl(item.path),
      path: item.path,
      name: item.name
    }));
  } catch (error) {
    console.warn("No se pudieron cargar los archivos del repositorio:", error);
    return [];
  }
}

function classifyVersionFiles(files) {
  return files.filter((file) => /\.txt$/i.test(file.name));
}

async function loadGitHubData() {
  if (!isRepoConfigured()) {
    renderEmpty(stableContainer, "Configura real owner y repo en app.js para cargar las versiones reales de GitHub.");
    renderEmpty(betaContainer, "Configura el repositorio real para mostrar las Betas disponibles.");
    renderEmpty(eegContainer, "Configura el repositorio real para listar los EEG oficiales.");
    return;
  }

  try {
    const rootFiles = await fetchRepoFiles(getGithubConfig().versionsPath || "");
    const eegFiles = await fetchRepoFiles(getGithubConfig().eegPath || "");

    const txtFiles = classifyVersionFiles(rootFiles);

    const stable = txtFiles.filter((file) => !/beta/i.test(file.name)).sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
    const beta = txtFiles.filter((file) => /beta/i.test(file.name)).sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));

    renderStableCards(stable);
    renderBetaCards(beta);
    renderEegCards(eegFiles);
  } catch (error) {
    console.error(error);
    renderEmpty(stableContainer, "No se pudieron cargar las versiones desde GitHub.");
    renderEmpty(betaContainer, "No se pudieron cargar las Betas desde GitHub.");
    renderEmpty(eegContainer, "No se pudieron cargar los EEG desde GitHub.");
  }
}

function bindNavigation() {
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.screen;
      if (!target || !screens[target]) return;
      setScreen(target);
    });
  });

  const startButton = document.getElementById("start-download-button");
  if (startButton) {
    startButton.addEventListener("click", async () => {
      setScreen("downloads");
    });
  }
}

downloadModalCancel.addEventListener("click", closeDownloadModal);
downloadModal.addEventListener("click", (event) => {
  if (event.target === downloadModal) {
    closeDownloadModal();
  }
});
downloadModalConfirm.addEventListener("click", async () => {
  if (!pendingDownloadAction) {
    closeDownloadModal();
    return;
  }

  const action = pendingDownloadAction;
  closeDownloadModal();
  await action();
});

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  setScreen("home");
  loadGitHubData();
});
