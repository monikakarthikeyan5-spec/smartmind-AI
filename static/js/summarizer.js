/**
 * Module 2: Smart Summarizer Controller
 */

(function () {
  let activeMode = "topic"; // 'topic' or 'text'
  let isSpeaking = false;
  let currentSpeech = null;

  function initSummarizer() {
    const btnModeTopic = document.getElementById("btn-sum-mode-topic");
    const btnModeText = document.getElementById("btn-sum-mode-text");
    const topicGroup = document.getElementById("summarizer-topic-group");
    const textGroup = document.getElementById("summarizer-text-group");
    const topicInput = document.getElementById("summarizer-topic-input");
    const textarea = document.getElementById("summarizer-textarea");
    const topicChips = document.getElementById("summarizer-topic-chips");
    const charCount = document.getElementById("summarizer-char-count");
    const btnSummarize = document.getElementById("btn-summarize");

    const outputCard = document.getElementById("summarizer-output-card");
    const mdContent = document.getElementById("summarizer-markdown-content");
    const statWords = document.getElementById("stat-output-words");
    const statSavings = document.getElementById("stat-savings");
    const statSavingsPill = document.getElementById("stat-savings-pill");
    const btnCopy = document.getElementById("btn-copy-summary");
    const btnSpeak = document.getElementById("btn-speak-summary");

    if (!btnSummarize) return;

    // Mode Toggle
    btnModeTopic.addEventListener("click", () => {
      soundFX.playClick();
      activeMode = "topic";
      btnModeTopic.classList.add("active");
      btnModeText.classList.remove("active");
      topicGroup.classList.remove("hidden");
      textGroup.classList.add("hidden");
      topicChips.classList.remove("hidden");
    });

    btnModeText.addEventListener("click", () => {
      soundFX.playClick();
      activeMode = "text";
      btnModeText.classList.add("active");
      btnModeTopic.classList.remove("active");
      topicGroup.classList.add("hidden");
      textGroup.classList.remove("hidden");
      topicChips.classList.add("hidden");
      textarea.focus();
    });

    // Real-time word counter
    textarea.addEventListener("input", () => {
      const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
      charCount.textContent = `${words} words`;
    });

    // Trigger Summarize
    btnSummarize.addEventListener("click", () => {
      const content = activeMode === "topic" 
        ? topicInput.value.trim() 
        : textarea.value.trim();

      if (!content) {
        showToast(
          activeMode === "topic" ? "Please enter a topic to summarize" : "Please paste study notes or text to summarize",
          "error"
        );
        if (activeMode === "topic") topicInput.focus();
        else textarea.focus();
        return;
      }

      soundFX.playClick();
      setLoading(true);

      const payload = {
        content: content,
        is_topic: activeMode === "topic",
        format_type: "comprehensive"
      };

      fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.summary) {
          soundFX.playSuccess();
          outputCard.classList.remove("hidden");
          renderMarkdown(data.summary, "summarizer-markdown-content");

          statWords.textContent = data.output_words || 0;
          if (activeMode === "text" && data.savings_pct > 0) {
            statSavings.textContent = `${data.savings_pct}%`;
            statSavingsPill.classList.remove("hidden");
          } else {
            statSavingsPill.classList.add("hidden");
          }

          if (data.notice) {
            showToast(data.notice, "info");
          }

          outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          showToast(data.error || "Failed to generate summary.", "error");
        }
      })
      .catch(err => {
        setLoading(false);
        showToast("Error connecting to server: " + err.message, "error");
      });
    });

    // Copy Summary
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        soundFX.playClick();
        const text = mdContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          showToast("Summary copied to clipboard!", "success");
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

    function setLoading(loading) {
      if (loading) {
        btnSummarize.disabled = true;
        btnSummarize.innerHTML = `<span class="spinner-inline"></span> Summarizing...`;
      } else {
        btnSummarize.disabled = false;
        btnSummarize.innerHTML = `<i class="fa-solid fa-compress"></i> <span>Generate Summary</span>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initSummarizer);
})();
