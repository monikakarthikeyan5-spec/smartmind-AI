/**
 * Module 1: Topic Explainer Controller
 */

(function () {
  let isSpeaking = false;
  let currentSpeech = null;

  function initExplainer() {
    const input = document.getElementById("explainer-topic-input");
    const levelSelect = document.getElementById("explainer-level");
    const styleSelect = document.getElementById("explainer-style");
    const btnExplain = document.getElementById("btn-explain");
    const outputCard = document.getElementById("explainer-output-card");
    const mdContent = document.getElementById("explainer-markdown-content");
    const resultBadge = document.getElementById("explainer-result-badge");
    const timestamp = document.getElementById("explainer-timestamp");
    const btnCopy = document.getElementById("btn-copy-explainer");
    const btnSpeak = document.getElementById("btn-speak-explainer");
    const btnQuizFrom = document.getElementById("btn-quiz-from-explainer");

    if (!btnExplain || !input) return;

    // Trigger explanation
    btnExplain.addEventListener("click", () => {
      const topic = input.value.trim();
      if (!topic) {
        showToast("Please enter a topic to explain", "error");
        input.focus();
        return;
      }

      soundFX.playClick();
      setLoading(true);

      const payload = {
        topic: topic,
        level: levelSelect.value,
        style: styleSelect.value
      };

      fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.content) {
          soundFX.playSuccess();
          outputCard.classList.remove("hidden");
          renderMarkdown(data.content, "explainer-markdown-content");
          resultBadge.textContent = `${data.topic} • ${data.level}`;
          timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          if (data.notice) {
            showToast(data.notice, "info");
          }

          // Scroll smoothly to output
          outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          showToast(data.error || "Failed to explain topic.", "error");
        }
      })
      .catch(err => {
        setLoading(false);
        showToast("Error connecting to server: " + err.message, "error");
      });
    });

    // Enter key triggers explanation
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        btnExplain.click();
      }
    });

    // Copy explanation text
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        soundFX.playClick();
        const text = mdContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          showToast("Explanation copied to clipboard!", "success");
        }).catch(() => {
          showToast("Could not copy to clipboard", "error");
        });
      });
    }

    // Text to Speech
    if (btnSpeak) {
      btnSpeak.addEventListener("click", () => {
        soundFX.playClick();
        if (!('speechSynthesis' in window)) {
          showToast("Speech synthesis is not supported in this browser.", "info");
          return;
        }

        if (isSpeaking) {
          window.speechSynthesis.cancel();
          isSpeaking = false;
          btnSpeak.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
          return;
        }

        const plainText = mdContent.innerText;
        if (!plainText) return;

        window.speechSynthesis.cancel();
        currentSpeech = new SpeechSynthesisUtterance(plainText);
        currentSpeech.rate = 1.0;
        currentSpeech.pitch = 1.0;

        currentSpeech.onend = () => {
          isSpeaking = false;
          btnSpeak.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
        };

        currentSpeech.onerror = () => {
          isSpeaking = false;
          btnSpeak.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
        };

        window.speechSynthesis.speak(currentSpeech);
        isSpeaking = true;
        btnSpeak.innerHTML = `<i class="fa-solid fa-circle-stop"></i> Stop`;
      });
    }

    // Cross-module bridge: Quiz Me On This
    if (btnQuizFrom) {
      btnQuizFrom.addEventListener("click", () => {
        const topic = input.value.trim();
        if (!topic) return;

        soundFX.playClick();
        window.switchTab("quiz");
        const quizInput = document.getElementById("quiz-topic-input");
        if (quizInput) {
          quizInput.value = topic;
          // Auto generate quiz
          setTimeout(() => {
            document.getElementById("btn-generate-quiz")?.click();
          }, 300);
        }
      });
    }

    function setLoading(loading) {
      if (loading) {
        btnExplain.disabled = true;
        btnExplain.innerHTML = `<span class="spinner-inline"></span> Explaining...`;
      } else {
        btnExplain.disabled = false;
        btnExplain.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Explain Topic</span>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initExplainer);
})();
