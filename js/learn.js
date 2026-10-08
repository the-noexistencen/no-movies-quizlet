// ==========================================================================
// Learn Feature (Adaptive Spaced Repetition, Multiple Choice & Written Mode)
// ==========================================================================

export class LearnController {
  constructor(storageService) {
    this.storage = storageService;
    this.currentSet = null;
    this.mode = 'mc'; // 'mc' (multiple choice) or 'written'
    
    // Spaced learning queues
    this.queue = [];
    this.mastered = [];
    this.currentCard = null;
    this.awaitingNext = false;

    this.initElements();
  }

  initElements() {
    this.promptText = document.getElementById('learnPromptText');
    this.mcContainer = document.getElementById('learnMcContainer');
    this.writtenContainer = document.getElementById('learnWrittenContainer');
    this.writtenInput = document.getElementById('learnWrittenInput');
    this.writtenSubmitBtn = document.getElementById('learnWrittenSubmit');
    this.feedbackBanner = document.getElementById('learnFeedbackBanner');
    this.feedbackHeadline = document.getElementById('learnFeedbackHeadline');
    this.feedbackDetails = document.getElementById('learnFeedbackDetails');
    this.feedbackContinueBtn = document.getElementById('learnFeedbackContinue');

    this.statMastered = document.getElementById('learnStatMastered');
    this.statRemaining = document.getElementById('learnStatRemaining');
    this.statTotal = document.getElementById('learnStatTotal');
    this.summaryModal = document.getElementById('learnSummaryModal');
    this.summaryMasteredScore = document.getElementById('learnSummaryScore');
    this.restartLearnBtn = document.getElementById('learnRestartBtn');

    this.toggleMcBtn = document.getElementById('learnToggleMc');
    this.toggleWrittenBtn = document.getElementById('learnToggleWritten');

    this.bindEvents();
  }

  bindEvents() {
    if (this.toggleMcBtn) {
      this.toggleMcBtn.addEventListener('click', () => {
        this.mode = 'mc';
        this.updateModeToggleUI();
        this.renderCurrentQuestion();
      });
    }

    if (this.toggleWrittenBtn) {
      this.toggleWrittenBtn.addEventListener('click', () => {
        this.mode = 'written';
        this.updateModeToggleUI();
        this.renderCurrentQuestion();
      });
    }

    if (this.writtenSubmitBtn) {
      this.writtenSubmitBtn.addEventListener('click', () => this.handleWrittenSubmit());
    }

    if (this.writtenInput) {
      this.writtenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleWrittenSubmit();
        }
      });
    }

    if (this.feedbackContinueBtn) {
      this.feedbackContinueBtn.addEventListener('click', () => {
        this.hideFeedback();
        this.nextQuestion();
      });
    }

    if (this.restartLearnBtn) {
      this.restartLearnBtn.addEventListener('click', () => {
        if (this.summaryModal) this.summaryModal.classList.remove('show');
        this.startLearnSession();
      });
    }

    // Number key shortcuts for Multiple Choice (1, 2, 3, 4) & Enter for continue
    window.addEventListener('keydown', (e) => {
      const learnView = document.getElementById('viewLearn');
      if (!learnView || !learnView.classList.contains('active')) return;

      if (this.awaitingNext) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.hideFeedback();
          this.nextQuestion();
        }
        return;
      }

      if (this.mode === 'mc' && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const options = this.mcContainer.querySelectorAll('.mc-option');
        if (options[index]) {
          options[index].click();
        }
      }
    });
  }

  updateModeToggleUI() {
    if (this.toggleMcBtn) this.toggleMcBtn.classList.toggle('active', this.mode === 'mc');
    if (this.toggleWrittenBtn) this.toggleWrittenBtn.classList.toggle('active', this.mode === 'written');
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;
    this.startLearnSession();
  }

  startLearnSession() {
    if (!this.currentSet || !this.currentSet.terms || this.currentSet.terms.length === 0) return;

    // Clone all terms into active study queue
    this.queue = [...this.currentSet.terms];
    // Shuffle queue initially
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }

    this.mastered = [];
    this.awaitingNext = false;
    this.updateStats();
    this.nextQuestion();
  }

  updateStats() {
    const total = this.currentSet ? this.currentSet.terms.length : 0;
    if (this.statMastered) this.statMastered.textContent = this.mastered.length;
    if (this.statRemaining) this.statRemaining.textContent = this.queue.length;
    if (this.statTotal) this.statTotal.textContent = total;
  }

  nextQuestion() {
    if (this.queue.length === 0) {
      this.showCompletionScreen();
      return;
    }

    this.currentCard = this.queue.shift();
    this.awaitingNext = false;
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    if (!this.currentCard) return;

    if (this.promptText) {
      this.promptText.textContent = this.currentCard.term;
    }

    this.hideFeedback();

    if (this.mode === 'mc') {
      this.mcContainer.style.display = 'grid';
      this.writtenContainer.style.display = 'none';
      this.renderMultipleChoiceOptions();
    } else {
      this.mcContainer.style.display = 'none';
      this.writtenContainer.style.display = 'flex';
      if (this.writtenInput) {
        this.writtenInput.value = '';
        setTimeout(() => this.writtenInput.focus(), 50);
      }
    }
  }

  renderMultipleChoiceOptions() {
    if (!this.mcContainer || !this.currentSet) return;

    const correctAnswer = this.currentCard.definition;
    const allDefs = this.currentSet.terms
      .map(t => t.definition)
      .filter(d => d !== correctAnswer);

    // Pick 3 random distractors
    const distractors = this.pickRandom(allDefs, 3);
    const options = this.shuffleArray([correctAnswer, ...distractors]);

    this.mcContainer.innerHTML = options.map((opt, idx) => `
      <button class="mc-option" data-answer="${this.escapeHtml(opt)}">
        <span class="mc-index-badge">${idx + 1}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    this.mcContainer.querySelectorAll('.mc-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.awaitingNext) return;
        this.handleMcSelection(btn.dataset.answer, btn);
      });
    });
  }

  handleMcSelection(selectedAnswer, buttonEl) {
    const isCorrect = selectedAnswer === this.currentCard.definition;
    const allOptions = this.mcContainer.querySelectorAll('.mc-option');

    allOptions.forEach(opt => {
      opt.disabled = true;
      if (opt.dataset.answer === this.currentCard.definition) {
        opt.classList.add('correct');
      }
    });

    if (isCorrect) {
      this.mastered.push(this.currentCard);
      this.showFeedback(true, 'Correct! Excellent job.', '');
      this.awaitingNext = true;
      this.updateStats();
      // Auto-advance quickly on correct choice
      setTimeout(() => {
        if (this.awaitingNext) {
          this.hideFeedback();
          this.nextQuestion();
        }
      }, 700);
    } else {
      buttonEl.classList.add('incorrect');
      // Re-queue card to end of practice queue
      this.queue.push(this.currentCard);
      this.showFeedback(false, 'Not quite right.', `Correct definition: <strong>${this.currentCard.definition}</strong>`);
      this.awaitingNext = true;
      this.updateStats();
    }
  }

  handleWrittenSubmit() {
    if (this.awaitingNext || !this.writtenInput) return;
    const userVal = this.writtenInput.value.trim();
    if (!userVal) return;

    const normalizedUser = this.normalizeText(userVal);
    const normalizedCorrect = this.normalizeText(this.currentCard.definition);
    const isCorrect = normalizedUser === normalizedCorrect;

    if (isCorrect) {
      this.mastered.push(this.currentCard);
      this.showFeedback(true, 'Spot on! Exactly right.', '');
      this.awaitingNext = true;
      this.updateStats();
      setTimeout(() => {
        if (this.awaitingNext) {
          this.hideFeedback();
          this.nextQuestion();
        }
      }, 800);
    } else {
      this.queue.push(this.currentCard);
      this.showFeedback(
        false,
        'Incorrect answer.',
        `You answered: <em>${this.escapeHtml(userVal)}</em><br>Correct answer: <strong>${this.currentCard.definition}</strong>`
      );
      this.awaitingNext = true;
      this.updateStats();
    }
  }

  showFeedback(isCorrect, headline, details) {
    if (!this.feedbackBanner) return;
    this.feedbackBanner.className = `learn-feedback-banner show ${isCorrect ? 'correct' : 'incorrect'}`;
    if (this.feedbackHeadline) this.feedbackHeadline.innerHTML = headline;
    if (this.feedbackDetails) this.feedbackDetails.innerHTML = details;
    if (this.feedbackContinueBtn) {
      this.feedbackContinueBtn.style.display = isCorrect ? 'none' : 'inline-flex';
    }
  }

  hideFeedback() {
    if (this.feedbackBanner) {
      this.feedbackBanner.className = 'learn-feedback-banner';
    }
  }

  showCompletionScreen() {
    if (!this.summaryModal) return;
    const total = this.currentSet.terms.length;
    if (this.summaryMasteredScore) {
      this.summaryMasteredScore.textContent = `${this.mastered.length} of ${total} Terms Mastered (100%)`;
    }
    this.summaryModal.classList.add('show');
  }

  normalizeText(str) {
    return str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ').trim();
  }

  pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  shuffleArray(arr) {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
