/**
 * Module 3: Quiz Generator & Interactive Testing Engine
 * Supports 1 to 20 questions, dynamic scoring, correct/wrong review & detailed explanations.
 */

(function () {
  let currentQuizData = null;
  let userAnswers = {}; // { questionIndex: 'A' | 'B' | 'C' | 'D' }
  let currentQuestionIndex = 0;
  let activeFilter = "all";

  function initQuiz() {
    const setupCard = document.getElementById("quiz-setup-card");
    const activeCard = document.getElementById("quiz-active-card");
    const resultsCard = document.getElementById("quiz-results-card");

    const topicInput = document.getElementById("quiz-topic-input");
    const countSlider = document.getElementById("quiz-count-slider");
    const countDisplay = document.getElementById("quiz-count-display");
    const difficultySelect = document.getElementById("quiz-difficulty");
    const btnGenerate = document.getElementById("btn-generate-quiz");

    // Active Quiz Controls
    const activeTitle = document.getElementById("active-quiz-title");
    const activeBadge = document.getElementById("active-quiz-badge");
    const currentQSpan = document.getElementById("current-q-index");
    const totalQSpan = document.getElementById("total-q-count");
    const progressBar = document.getElementById("quiz-progress-bar");
    const qContainer = document.getElementById("question-container");
    const btnPrev = document.getElementById("btn-prev-question");
    const btnNext = document.getElementById("btn-next-question");
    const btnSubmit = document.getElementById("btn-submit-quiz");
    const stepperDots = document.getElementById("quiz-stepper-dots");

    // Results Screen Controls
    const scoreGauge = document.getElementById("score-gauge");
    const scorePct = document.getElementById("score-percentage");
    const scoreHeadline = document.getElementById("score-headline");
    const scoreSubtext = document.getElementById("score-subtext");
    const metricCorrect = document.getElementById("metric-correct");
    const metricWrong = document.getElementById("metric-wrong");
    const filterAll = document.getElementById("filter-all");
    const filterCorrect = document.getElementById("filter-correct");
    const filterWrong = document.getElementById("filter-wrong");
    const countAllSpan = document.getElementById("count-filter-all");
    const countCorrectSpan = document.getElementById("count-filter-correct");
    const countWrongSpan = document.getElementById("count-filter-wrong");
    const reviewList = document.getElementById("review-questions-list");
    const btnRetake = document.getElementById("btn-retake-quiz");
    const btnNewQuiz = document.getElementById("btn-new-quiz");

    if (!btnGenerate) return;

    // Slider listener
    countSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      countDisplay.textContent = `${val} Question${val > 1 ? 's' : ''}`;
    });

    // Generate Quiz
    btnGenerate.addEventListener("click", () => {
      const topic = topicInput.value.trim();
      if (!topic) {
        showToast("Please enter a quiz topic", "error");
        topicInput.focus();
        return;
      }

      const count = parseInt(countSlider.value, 10);
      const difficulty = difficultySelect.value;

      soundFX.playClick();
      setLoading(true);

      fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          count: count,
          difficulty: difficulty
        })
      })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.questions && data.questions.length > 0) {
          soundFX.playSuccess();
          currentQuizData = data;
          startQuiz(data);
          if (data.notice) {
            showToast(data.notice, "info");
          }
        } else {
          showToast(data.error || "Failed to generate quiz.", "error");
        }
      })
      .catch(err => {
        setLoading(false);
        showToast("Error connecting to server: " + err.message, "error");
      });
    });

    // Start Quiz Execution
    function startQuiz(data) {
      userAnswers = {};
      currentQuestionIndex = 0;

      setupCard.classList.add("hidden");
      resultsCard.classList.add("hidden");
      activeCard.classList.remove("hidden");

      activeTitle.textContent = data.topic;
      activeBadge.textContent = `${data.difficulty} (${data.questions.length} Qs)`;
      totalQSpan.textContent = data.questions.length;

      buildStepperDots(data.questions.length);
      renderCurrentQuestion();
      activeCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Build Navigation Stepper Dots
    function buildStepperDots(total) {
      stepperDots.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const dot = document.createElement("span");
        dot.className = `step-dot ${i === 0 ? "active" : ""}`;
        dot.title = `Go to question ${i + 1}`;
        dot.addEventListener("click", () => {
          soundFX.playClick();
          currentQuestionIndex = i;
          renderCurrentQuestion();
        });
        stepperDots.appendChild(dot);
      }
    }

    // Render Current Question
    function renderCurrentQuestion() {
      const total = currentQuizData.questions.length;
      const q = currentQuizData.questions[currentQuestionIndex];

      currentQSpan.textContent = currentQuestionIndex + 1;
      const pct = Math.round(((currentQuestionIndex + 1) / total) * 100);
      progressBar.style.width = `${pct}%`;

      // Update stepper dots
      const dots = stepperDots.querySelectorAll(".step-dot");
      dots.forEach((d, idx) => {
        d.classList.toggle("active", idx === currentQuestionIndex);
        d.classList.toggle("answered", userAnswers[idx] !== undefined);
      });

      // Navigation button visibility
      btnPrev.disabled = currentQuestionIndex === 0;
      if (currentQuestionIndex === total - 1) {
        btnNext.classList.add("hidden");
        btnSubmit.classList.remove("hidden");
      } else {
        btnNext.classList.remove("hidden");
        btnSubmit.classList.add("hidden");
      }

      // Build Question HTML
      const selectedOption = userAnswers[currentQuestionIndex];
      let optionsHtml = "";

      ['A', 'B', 'C', 'D'].forEach(letter => {
        const optText = q.options[letter] || "";
        const isSelected = selectedOption === letter;
        optionsHtml += `
          <div class="option-item ${isSelected ? 'selected' : ''}" data-letter="${letter}">
            <div class="option-letter">${letter}</div>
            <div class="option-text">${optText}</div>
          </div>
        `;
      });

      qContainer.innerHTML = `
        <div class="question-text">${q.question}</div>
        <div class="quiz-options-list" id="options-list">
          ${optionsHtml}
        </div>
      `;

      // Attach option click listeners
      const optionElements = qContainer.querySelectorAll(".option-item");
      optionElements.forEach(opt => {
        opt.addEventListener("click", () => {
          soundFX.playClick();
          const letter = opt.dataset.letter;
          userAnswers[currentQuestionIndex] = letter;

          optionElements.forEach(o => o.classList.remove("selected"));
          opt.classList.add("selected");

          // Update current dot to answered
          dots[currentQuestionIndex].classList.add("answered");
        });
      });
    }

    // Navigation Controls
    btnPrev.addEventListener("click", () => {
      if (currentQuestionIndex > 0) {
        soundFX.playClick();
        currentQuestionIndex--;
        renderCurrentQuestion();
      }
    });

    btnNext.addEventListener("click", () => {
      if (currentQuestionIndex < currentQuizData.questions.length - 1) {
        soundFX.playClick();
        currentQuestionIndex++;
        renderCurrentQuestion();
      }
    });

    btnSubmit.addEventListener("click", () => {
      soundFX.playClick();
      const total = currentQuizData.questions.length;
      const answeredCount = Object.keys(userAnswers).length;

      if (answeredCount < total) {
        const confirmSubmit = confirm(
          `You have answered ${answeredCount} of ${total} questions. Are you sure you want to finish the quiz?`
        );
        if (!confirmSubmit) return;
      }

      evaluateQuizResults();
    });

    // Evaluate & Display Results
    function evaluateQuizResults() {
      soundFX.playSuccess();
      activeCard.classList.add("hidden");
      resultsCard.classList.remove("hidden");

      const total = currentQuizData.questions.length;
      let correctCount = 0;
      let wrongCount = 0;

      currentQuizData.questions.forEach((q, idx) => {
        const userChoice = userAnswers[idx];
        const correctChoice = q.correct_option;
        if (userChoice && userChoice.toUpperCase() === correctChoice.toUpperCase()) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const percentage = Math.round((correctCount / total) * 100);

      // Gauge animation
      scorePct.textContent = `${percentage}%`;
      const gaugeDeg = Math.round((percentage / 100) * 360);
      scoreGauge.style.setProperty("--gauge-deg", `${gaugeDeg}deg`);

      // Headline and color
      if (percentage >= 80) {
        scoreHeadline.textContent = "Outstanding Performance! 🏆";
        scoreGauge.style.setProperty("--emerald-primary", "#10b981");
      } else if (percentage >= 50) {
        scoreHeadline.textContent = "Good Effort! Keep Practicing 👍";
        scoreGauge.style.setProperty("--emerald-primary", "#f59e0b");
      } else {
        scoreHeadline.textContent = "Needs Review & Reinforcement 📚";
        scoreGauge.style.setProperty("--emerald-primary", "#f43f5e");
      }

      scoreSubtext.textContent = `You correctly answered ${correctCount} out of ${total} questions.`;
      metricCorrect.textContent = correctCount;
      metricWrong.textContent = wrongCount;

      countAllSpan.textContent = total;
      countCorrectSpan.textContent = correctCount;
      countWrongSpan.textContent = wrongCount;

      renderReviewCards();
      resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Render Detailed Answer Review Cards
    function renderReviewCards() {
      reviewList.innerHTML = "";

      currentQuizData.questions.forEach((q, idx) => {
        const userChoice = userAnswers[idx];
        const correctChoice = q.correct_option;
        const isCorrect = userChoice && userChoice.toUpperCase() === correctChoice.toUpperCase();

        // Check active filter
        if (activeFilter === "correct" && !isCorrect) return;
        if (activeFilter === "wrong" && isCorrect) return;

        const card = document.createElement("div");
        card.className = `review-card ${isCorrect ? "correct-card" : "wrong-card"}`;

        const userOptionText = userChoice ? `${userChoice}: ${q.options[userChoice] || ''}` : "Not Answered";
        const correctOptionText = `${correctChoice}: ${q.options[correctChoice] || ''}`;

        card.innerHTML = `
          <div class="review-card-header">
            <div class="review-card-question">Q${idx + 1}. ${q.question}</div>
            <span class="review-status-tag ${isCorrect ? 'tag-correct' : 'tag-wrong'}">
              <i class="fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}"></i> ${isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>

          <div class="review-answer-grid">
            <div class="review-badge-user">
              <strong>Your Answer:</strong> ${userOptionText}
            </div>
            <div class="review-badge-correct">
              <strong>Correct Answer:</strong> ${correctOptionText}
            </div>
          </div>

          <div class="review-explanation">
            <strong>💡 Explanation:</strong> ${q.explanation}
          </div>
        `;

        reviewList.appendChild(card);
      });
    }

    // Filter Tabs
    [filterAll, filterCorrect, filterWrong].forEach(tab => {
      tab.addEventListener("click", () => {
        soundFX.playClick();
        [filterAll, filterCorrect, filterWrong].forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeFilter = tab.dataset.filter;
        renderReviewCards();
      });
    });

    // Retake Quiz (Same questions)
    btnRetake.addEventListener("click", () => {
      soundFX.playClick();
      userAnswers = {};
      currentQuestionIndex = 0;
      resultsCard.classList.add("hidden");
      activeCard.classList.remove("hidden");
      buildStepperDots(currentQuizData.questions.length);
      renderCurrentQuestion();
      activeCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // New Quiz
    btnNewQuiz.addEventListener("click", () => {
      soundFX.playClick();
      resultsCard.classList.add("hidden");
      activeCard.classList.add("hidden");
      setupCard.classList.remove("hidden");
      topicInput.value = "";
      topicInput.focus();
      setupCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function setLoading(loading) {
      if (loading) {
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = `<span class="spinner-inline"></span> Generating Quiz...`;
      } else {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `<i class="fa-solid fa-play"></i> <span>Generate Quiz</span>`;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initQuiz);
})();
