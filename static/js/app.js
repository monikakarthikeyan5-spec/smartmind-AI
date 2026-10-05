/**
 * StudyMind AI - Core App Controller
 * Manages tab navigation, theme, audio feedback, settings modal, and API interactions.
 */

// Sound Synthesizer via Web Audio API (Zero external assets needed)
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  _init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.18);
      });
    } catch (e) {}
  }
}

const soundFX = new SoundFX();

// Toast Notifications Helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-triangle-exclamation";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation & Tab Switching
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const panes = document.querySelectorAll(".module-pane");
  const crumbTitle = document.getElementById("crumb-current-module");
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("sidebar");

  const moduleNames = {
    explainer: "Topic Explainer",
    summarizer: "Smart Summarizer",
    quiz: "Quiz Generator",
    doubts: "Doubt Solver",
    planner: "Study Planner"
  };

  window.switchTab = function(tabId) {
    soundFX.playClick();
    navItems.forEach(item => {
      const isTarget = item.dataset.tab === tabId;
      item.classList.toggle("active", isTarget);
      item.setAttribute("aria-selected", isTarget ? "true" : "false");
    });

    panes.forEach(pane => {
      pane.classList.toggle("active", pane.id === `pane-${tabId}`);
    });

    if (crumbTitle && moduleNames[tabId]) {
      crumbTitle.textContent = moduleNames[tabId];
    }

    if (sidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
  };

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.dataset.tab;
      window.switchTab(tabId);
    });
  });

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

// Theme Toggle
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const html = document.documentElement;

  const savedTheme = localStorage.getItem("studymind_theme") || "dark";
  html.setAttribute("data-theme", savedTheme);
  updateIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = html.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("studymind_theme", next);
      updateIcon(next);
      soundFX.playClick();
    });
  }

  function updateIcon(theme) {
    if (!themeIcon) return;
    if (theme === "dark") {
      themeIcon.className = "fa-solid fa-moon";
    } else {
      themeIcon.className = "fa-solid fa-sun";
    }
  }
}

// Sound Toggle
function initSoundControl() {
  const soundBtn = document.getElementById("sound-toggle");
  const soundIcon = document.getElementById("sound-icon");

  if (soundBtn && soundIcon) {
    soundBtn.addEventListener("click", () => {
      soundFX.enabled = !soundFX.enabled;
      soundIcon.className = soundFX.enabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
      showToast(soundFX.enabled ? "Sound feedback enabled" : "Sound feedback muted", "info");
    });
  }
}

// Status & Settings Modal
function initSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const btnOpen = document.getElementById("btn-open-settings");
  const btnClose = document.getElementById("btn-close-modal");
  const btnCancel = document.getElementById("btn-cancel-modal");
  const btnSave = document.getElementById("btn-save-key");
  const keyInput = document.getElementById("settings-api-key");
  const toggleEye = document.getElementById("btn-toggle-key-visibility");
  const eyeIcon = document.getElementById("eye-icon");
  const statusLabel = document.getElementById("status-label");
  const statusDot = document.getElementById("status-dot");
  const keyStatusMsg = document.getElementById("key-status-msg");

  // Fetch initial status
  function checkStatus() {
    fetch("/api/status")
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          statusLabel.textContent = "Groq API Connected";
          statusDot.className = "status-dot";
          keyStatusMsg.textContent = `Connected with key (${data.masked_key}). Ready for fast queries.`;
        } else {
          statusLabel.textContent = "Ready (Offline/Key Setup)";
          statusDot.className = "status-dot warning";
          keyStatusMsg.textContent = "No Groq API key set yet. Click save to set one or use offline engine.";
        }
      })
      .catch(err => {
        statusLabel.textContent = "Local Server";
        statusDot.className = "status-dot warning";
      });
  }

  checkStatus();

  function openModal() {
    soundFX.playClick();
    modal.classList.remove("hidden");
    checkStatus();
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  if (btnOpen) btnOpen.addEventListener("click", openModal);
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  // Close when clicking backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Toggle eye visibility
  if (toggleEye && keyInput) {
    toggleEye.addEventListener("click", () => {
      const isPwd = keyInput.type === "password";
      keyInput.type = isPwd ? "text" : "password";
      eyeIcon.className = isPwd ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  }

  // Save key
  if (btnSave && keyInput) {
    btnSave.addEventListener("click", () => {
      const key = keyInput.value.trim();
      if (!key) {
        showToast("Please enter a valid Groq API key (starts with gsk_)", "error");
        return;
      }

      btnSave.disabled = true;
      btnSave.innerHTML = `<span class="spinner-inline"></span> Connecting...`;

      fetch("/api/settings/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key })
      })
      .then(r => r.json())
      .then(data => {
        btnSave.disabled = false;
        btnSave.innerHTML = `<i class="fa-solid fa-check"></i> Save & Connect`;
        if (data.success) {
          showToast("Groq API Key saved successfully!", "success");
          soundFX.playSuccess();
          checkStatus();
          closeModal();
          keyInput.value = "";
        } else {
          showToast(data.error || "Failed to save key", "error");
        }
      })
      .catch(err => {
        btnSave.disabled = false;
        btnSave.innerHTML = `<i class="fa-solid fa-check"></i> Save & Connect`;
        showToast("Error updating key: " + err.message, "error");
      });
    });
  }
}

// Global chip click handler
function initSuggestionChips() {
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;

    const targetModule = chip.dataset.target;
    const value = chip.dataset.value;
    if (!targetModule || !value) return;

    soundFX.playClick();

    if (targetModule === "explainer") {
      const input = document.getElementById("explainer-topic-input");
      if (input) {
        input.value = value;
        document.getElementById("btn-explain")?.click();
      }
    } else if (targetModule === "summarizer") {
      const input = document.getElementById("summarizer-topic-input");
      if (input) {
        input.value = value;
        document.getElementById("btn-summarize")?.click();
      }
    } else if (targetModule === "quiz") {
      const input = document.getElementById("quiz-topic-input");
      if (input) {
        input.value = value;
        document.getElementById("btn-generate-quiz")?.click();
      }
    }
  });
}

// Markdown Formatter Helper
window.renderMarkdown = function(mdText, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (window.marked && window.DOMPurify) {
    const rawHtml = window.marked.parse(mdText);
    const cleanHtml = window.DOMPurify.sanitize(rawHtml);
    container.innerHTML = cleanHtml;
  } else {
    container.innerText = mdText;
  }
};

// Global Initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initTheme();
  initSoundControl();
  initSettingsModal();
  initSuggestionChips();
});
