// ==========================================================================
// Learn Feature (Adaptive Learning, Multiple Choice & Written Mode)
// Pure button-driven UI, zero emojis
// ==========================================================================

export class LearnController {
  constructor(storageService, toastFn) {
    this.storage = storageService;
    this.toast = toastFn || console.log;
    this.currentSet = null;
    this.mode = 'mc'; // 'mc' or 'written'
    
    this.queue = [];
    this.mastered = [];
    this.currentCard = null;
    this.awaitingNext = false;

    this.initElements();
  }

  initElements() {
    this.deckTitleEl = document.getElementById('learnDeckTitle');
    this.toggleModeBtn = document.getElementById('learnToggleMode');
    this.masteredCountEl = document.getElementById('learnMasteredCount');
    this.remainingCountEl = document.getElementById('learnRemainingCount');
    this.totalCountEl = document.getElementById('learnTotalCount');

    this.promptEl = document.getElementById('learnPrompt');
    this.mcGrid = document.getElementById('learnMcGrid');
    this.writtenWrap = document.getElementById('learnWrittenWrap');
    this.writtenInput = document.getElementById('learnWrittenInput');
    this.writtenSubmitBtn = document.getElementById('learnWrittenSubmit');

    this.feedbackBox = document.getElementById('learnFeedback');
    this.feedbackText = document.getElementById('learnFeedbackText');
    this.feedbackDetail = document.getElementById('learnFeedbackDetail');
    this.feedbackContinueBtn = document.getElementById('learnFeedbackContinue');

    this.bindEvents();
  }

  bindEvents() {
    if (this.toggleModeBtn) {
      this.toggleModeBtn.addEventListener('click', () => {
        this.mode = this.mode === 'mc' ? 'written' : 'mc';
        this.toggleModeBtn.textContent = this.mode === 'mc' ? 'Mode: Multiple Choice' : 'Mode: Type Answer';
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

    window.addEventListener('keydown', (e) => {
      const learnView = document.getElementById('learnView');
      if (!learnView || learnView.style.display === 'none') return;

      if (this.awaitingNext) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.hideFeedback();
          this.nextQuestion();
        }
        return;
      }

      if (this.mode === 'mc' && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const options = this.mcGrid.querySelectorAll('.mc-choice-btn');
        if (options[index]) {
          options[index].click();
        }
      }
    });
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;
    if (this.deckTitleEl) this.deckTitleEl.textContent = this.currentSet.title;
    this.startSession();
  }

  startSession() {
    if (!this.currentSet || !this.currentSet.terms || this.currentSet.terms.length === 0) return;

    this.queue = [...this.currentSet.terms];
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
    if (this.masteredCountEl) this.masteredCountEl.textContent = this.mastered.length;
    if (this.remainingCountEl) this.remainingCountEl.textContent = this.queue.length;
    if (this.totalCountEl) this.totalCountEl.textContent = total;
  }

  nextQuestion() {
    if (this.queue.length === 0) {
      this.toast('100% Mastered! Starting review session.');
      this.startSession();
      return;
    }

    this.currentCard = this.queue.shift();
    this.awaitingNext = false;
    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    if (!this.currentCard) return;

    if (this.promptEl) this.promptEl.textContent = this.currentCard.term;
    this.hideFeedback();

    if (this.mode === 'mc') {
      this.mcGrid.style.display = 'flex';
      this.writtenWrap.style.display = 'none';
      this.renderMcOptions();
    } else {
      this.mcGrid.style.display = 'none';
      this.writtenWrap.style.display = 'flex';
      if (this.writtenInput) {
        this.writtenInput.value = '';
        setTimeout(() => this.writtenInput.focus(), 50);
      }
    }
  }

  renderMcOptions() {
    if (!this.mcGrid || !this.currentSet) return;

    const correctAnswer = this.currentCard.definition;
    const allDefs = this.currentSet.terms
      .map(t => t.definition)
      .filter(d => d !== correctAnswer);

    const distractors = this.pickRandom(allDefs, 3);
    const options = this.shuffleArray([correctAnswer, ...distractors]);

    this.mcGrid.innerHTML = options.map((opt, idx) => `
      <button class="mc-choice-btn" data-answer="${this.escapeHtml(opt)}">
        <span class="mc-badge">${idx + 1}</span>
        <span>${this.escapeHtml(opt)}</span>
      </button>
    `).join('');

    this.mcGrid.querySelectorAll('.mc-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.awaitingNext) return;
        this.handleMcChoice(btn.dataset.answer, btn);
      });
    });
  }

  handleMcChoice(chosen, btnEl) {
    const isCorrect = chosen === this.currentCard.definition;
    const allBtns = this.mcGrid.querySelectorAll('.mc-choice-btn');

    allBtns.forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === this.currentCard.definition) {
        b.classList.add('correct');
      }
    });

    if (isCorrect) {
      this.mastered.push(this.currentCard);
      this.showFeedback(true, 'Correct', '');
      this.awaitingNext = true;
      this.updateStats();
      setTimeout(() => {
        if (this.awaitingNext) {
          this.hideFeedback();
          this.nextQuestion();
        }
      }, 600);
    } else {
      btnEl.classList.add('incorrect');
      this.queue.push(this.currentCard);
      this.showFeedback(false, 'Incorrect', `Correct answer: <strong>${this.escapeHtml(this.currentCard.definition)}</strong>`);
      this.awaitingNext = true;
      this.updateStats();
    }
  }

  handleWrittenSubmit() {
    if (this.awaitingNext || !this.writtenInput) return;
    const userVal = this.writtenInput.value.trim();
    if (!userVal) return;

    const normalizedUser = this.normalize(userVal);
    const normalizedCorrect = this.normalize(this.currentCard.definition);
    const isCorrect = normalizedUser === normalizedCorrect;

    if (isCorrect) {
      this.mastered.push(this.currentCard);
      this.showFeedback(true, 'Correct', '');
      this.awaitingNext = true;
      this.updateStats();
      setTimeout(() => {
        if (this.awaitingNext) {
          this.hideFeedback();
          this.nextQuestion();
        }
      }, 700);
    } else {
      this.queue.push(this.currentCard);
      this.showFeedback(false, 'Incorrect', `Correct answer: <strong>${this.escapeHtml(this.currentCard.definition)}</strong>`);
      this.awaitingNext = true;
      this.updateStats();
    }
  }

  showFeedback(isCorrect, text, detail) {
    if (!this.feedbackBox) return;
    this.feedbackBox.className = `learn-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
    if (this.feedbackText) this.feedbackText.textContent = text;
    if (this.feedbackDetail) this.feedbackDetail.innerHTML = detail;
    if (this.feedbackContinueBtn) {
      this.feedbackContinueBtn.style.display = isCorrect ? 'none' : 'block';
    }
  }

  hideFeedback() {
    if (this.feedbackBox) {
      this.feedbackBox.className = 'learn-feedback';
    }
  }

  normalize(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
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
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
