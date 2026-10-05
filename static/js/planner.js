/**
 * Module 5: Intelligent Study Planner Controller
 * Creates customized daily study schedules and milestone roadmaps.
 */

(function () {
  let subjectsList = ["Mathematics", "Physics", "Computer Science"];

  function initPlanner() {
    const tagsContainer = document.getElementById("tags-list");
    const newSubjectInput = document.getElementById("new-subject-input");
    const btnAddSubject = document.getElementById("btn-add-subject");
    const examDateInput = document.getElementById("planner-exam-date");
    const daysBadge = document.getElementById("days-remaining-badge");
    const hoursSlider = document.getElementById("planner-daily-hours");
    const hoursDisplay = document.getElementById("hours-display");
    const routineSelect = document.getElementById("planner-routine");
    const goalSelect = document.getElementById("planner-goal");
    const btnGenerate = document.getElementById("btn-generate-planner");

    const outputCard = document.getElementById("planner-output-card");
    const mdContent = document.getElementById("planner-markdown-content");
    const btnCopy = document.getElementById("btn-copy-planner");
    const btnPrint = document.getElementById("btn-print-planner");

    if (!btnGenerate) return;

    // Set default exam date to 14 days from today
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 14);
    const dateStr = futureDate.toISOString().split("T")[0];
    examDateInput.value = dateStr;
    updateDaysRemaining(dateStr);

    // Date change listener
    examDateInput.addEventListener("change", (e) => {
      updateDaysRemaining(e.target.value);
    });

    function updateDaysRemaining(val) {
      if (!val) {
        daysBadge.textContent = "Select an exam date";
        return;
      }
      const target = new Date(val);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = target - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        daysBadge.textContent = "Exam date has already passed!";
        daysBadge.style.color = "var(--rose-primary)";
      } else if (diffDays === 0) {
        daysBadge.textContent = "Exam is TODAY! Final revision mode.";
        daysBadge.style.color = "var(--amber-primary)";
      } else {
        daysBadge.textContent = `🎯 ${diffDays} day${diffDays > 1 ? 's' : ''} remaining until exam`;
        daysBadge.style.color = "var(--emerald-primary)";
      }
    }

    // Render Subjects Tags
    function renderTags() {
      tagsContainer.innerHTML = "";
      subjectsList.forEach((sub, idx) => {
        const tag = document.createElement("span");
        tag.className = "subject-tag";
        tag.innerHTML = `${escapeHtml(sub)} <button class="btn-tag-remove" data-index="${idx}" aria-label="Remove subject">&times;</button>`;
        tagsContainer.appendChild(tag);
      });

      // Attach remove events
      tagsContainer.querySelectorAll(".btn-tag-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
          soundFX.playClick();
          const idx = parseInt(btn.dataset.index, 10);
          subjectsList.splice(idx, 1);
          renderTags();
        });
      });
    }

    renderTags();

    // Add new subject
    function addSubject() {
      const val = newSubjectInput.value.trim();
      if (!val) return;
      if (subjectsList.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
        showToast("Subject already added!", "info");
        return;
      }
      soundFX.playClick();
      subjectsList.push(val);
      newSubjectInput.value = "";
      renderTags();
    }

    btnAddSubject.addEventListener("click", addSubject);
    newSubjectInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSubject();
      }
    });

    // Hours slider live display
    hoursSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value).toFixed(1);
      hoursDisplay.textContent = `${val} Hours / day`;
    });

    // Generate Plan
    btnGenerate.addEventListener("click", () => {
      if (subjectsList.length === 0) {
        showToast("Please add at least one subject", "error");
        newSubjectInput.focus();
        return;
      }

      const examDate = examDateInput.value;
      if (!examDate) {
        showToast("Please pick a target exam date", "error");
        examDateInput.focus();
        return;
      }

      const dailyHours = parseFloat(hoursSlider.value);
      const routine = routineSelect.value;
      const targetGoal = goalSelect.value;

      soundFX.playClick();
      setLoading(true);

      const payload = {
        subjects: subjectsList,
        exam_date: examDate,
        daily_hours: dailyHours,
        routine: routine,
        target_goal: targetGoal
      };

      fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.plan) {
          soundFX.playSuccess();
          outputCard.classList.remove("hidden");
          renderMarkdown(data.plan, "planner-markdown-content");

          if (data.notice) {
            showToast(data.notice, "info");
          }

          outputCard.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          showToast(data.error || "Failed to generate study plan.", "error");
        }
      })
      .catch(err => {
        setLoading(false);
        showToast("Error connecting to server: " + err.message, "error");
      });
    });

    // Copy Plan
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        soundFX.playClick();
        const text = mdContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          showToast("Study plan copied to clipboard!", "success");
        }).catch(() => {
          showToast("Could not copy plan", "error");
        });
      });
    }

    // Print Plan / Save PDF
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        soundFX.playClick();
        window.print();
      });
    }

    function setLoading(loading) {
      if (loading) {
        btnGenerate.disabled = true;
        btnGenerate.innerHTML = `<span class="spinner-inline"></span> Crafting Schedule...`;
      } else {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate Study Plan</span>`;
      }
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }

  document.addEventListener("DOMContentLoaded", initPlanner);
})();
