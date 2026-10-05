/**
 * Module 4: Academic Doubt Solver Controller
 * Interactive conversational chat supporting follow-up questions and pedagogical answers.
 */

(function () {
  let conversationHistory = []; // [ { role: 'user' | 'assistant', content: string } ]

  function initDoubts() {
    const input = document.getElementById("doubt-input");
    const btnSend = document.getElementById("btn-send-doubt");
    const messagesContainer = document.getElementById("chat-messages-container");
    const btnClear = document.getElementById("btn-clear-chat");
    const quickChips = document.querySelectorAll(".quick-chip");

    if (!btnSend || !input) return;

    // Auto-grow textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    // Enter to send (Shift+Enter for newline)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btnSend.click();
      }
    });

    // Send doubt question
    btnSend.addEventListener("click", () => {
      const question = input.value.trim();
      if (!question) return;

      soundFX.playClick();

      // Append User message
      appendMessage("user", question);
      input.value = "";
      input.style.height = "auto";

      // Append temporary loading assistant bubble
      const loadingBubble = appendLoadingBubble();

      // API Call
      fetch("/api/doubt/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          history: conversationHistory
        })
      })
      .then(res => res.json())
      .then(data => {
        loadingBubble.remove();
        if (data.success && data.answer) {
          soundFX.playSuccess();
          appendMessage("assistant", data.answer);
          // Store in history for follow-ups
          conversationHistory.push({ role: "user", content: question });
          conversationHistory.push({ role: "assistant", content: data.answer });

          if (data.notice) {
            showToast(data.notice, "info");
          }
        } else {
          appendMessage("assistant", "⚠️ " + (data.error || "Sorry, I could not process your doubt. Please try again."));
        }
      })
      .catch(err => {
        loadingBubble.remove();
        appendMessage("assistant", "⚠️ Error connecting to server: " + err.message);
      });
    });

    // Quick suggestion chips
    quickChips.forEach(chip => {
      chip.addEventListener("click", () => {
        soundFX.playClick();
        const prompt = chip.dataset.prompt;
        if (prompt) {
          input.value = prompt;
          btnSend.click();
        }
      });
    });

    // Clear chat
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        soundFX.playClick();
        conversationHistory = [];
        messagesContainer.innerHTML = `
          <div class="chat-message assistant">
            <div class="message-avatar"><i class="fa-solid fa-graduation-cap"></i></div>
            <div class="message-bubble">
              <div class="message-text">
                <p>Hello! I am your AI academic tutor. What doubt or problem can I help you understand today?</p>
                <p class="subtle-tip">You can ask me to solve formulas, clarify difficult theories, give intuitive analogies, and ask as many follow-up questions as you like!</p>
              </div>
            </div>
          </div>
        `;
        showToast("Conversation cleared", "info");
      });
    }

    // Helper: append message
    function appendMessage(role, text) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `chat-message ${role}`;

      const avatarIcon = role === "assistant" ? "fa-graduation-cap" : "fa-user";
      
      let formattedHtml = "";
      if (role === "assistant" && window.marked && window.DOMPurify) {
        formattedHtml = window.DOMPurify.sanitize(window.marked.parse(text));
      } else {
        formattedHtml = `<p>${escapeHtml(text)}</p>`;
      }

      msgDiv.innerHTML = `
        <div class="message-avatar"><i class="fa-solid ${avatarIcon}"></i></div>
        <div class="message-bubble">
          <div class="message-text markdown-body">${formattedHtml}</div>
          ${role === "assistant" ? `
            <div class="output-actions" style="margin-top: 8px; justify-content: flex-end;">
              <button class="btn-action btn-copy-chat" title="Copy answer">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          ` : ''}
        </div>
      `;

      // Copy listener on answer
      const copyBtn = msgDiv.querySelector(".btn-copy-chat");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          soundFX.playClick();
          navigator.clipboard.writeText(text).then(() => {
            showToast("Answer copied!", "success");
          });
        });
      }

      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Helper: loading bubble
    function appendLoadingBubble() {
      const bubble = document.createElement("div");
      bubble.className = "chat-message assistant";
      bubble.innerHTML = `
        <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-bubble">
          <div class="message-text" style="display: flex; align-items: center; gap: 8px; color: var(--text-muted);">
            <span class="spinner-inline"></span> Thinking & formulating clear explanation...
          </div>
        </div>
      `;
      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return bubble;
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  document.addEventListener("DOMContentLoaded", initDoubts);
})();
