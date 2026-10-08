// ==========================================================================
// Match Feature (Timed Matching Game)
// ==========================================================================

export class MatchController {
  constructor(storageService, toastFn) {
    this.storage = storageService;
    this.toast = toastFn || console.log;
    this.currentSet = null;

    this.timerInterval = null;
    this.startTime = null;
    this.elapsedSeconds = 0;

    this.firstSelected = null;
    this.secondSelected = null;
    this.isProcessing = false;
    this.matchedPairsCount = 0;
    this.totalPairs = 0;

    this.initElements();
  }

  initElements() {
    this.clockEl = document.getElementById('matchClock');
    this.bestLabel = document.getElementById('matchBestLabel');
    this.restartBtn = document.getElementById('matchRestart');
    this.matrixContainer = document.getElementById('matchMatrix');

    this.bindEvents();
  }

  bindEvents() {
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.startNewGame());
    }
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;
    this.updateBestDisplay();
    this.startNewGame();
  }

  updateBestDisplay() {
    if (!this.bestLabel || !this.currentSet) return;
    const best = this.storage.getBestMatchTime(this.currentSet.id);
    this.bestLabel.textContent = best !== null ? `Best: ${best.toFixed(1)}s` : 'Best: --';
  }

  startNewGame() {
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.updateTimerDisplay(0);
    this.firstSelected = null;
    this.secondSelected = null;
    this.isProcessing = false;
    this.matchedPairsCount = 0;

    if (!this.currentSet || !this.currentSet.terms || this.currentSet.terms.length === 0) {
      if (this.matrixContainer) this.matrixContainer.innerHTML = '<p style="color: var(--text-muted); padding: 16px;">Deck has no cards.</p>';
      return;
    }

    const available = [...this.currentSet.terms];
    const pairsToUse = this.shuffleArray(available).slice(0, 6);
    this.totalPairs = pairsToUse.length;

    const tiles = [];
    pairsToUse.forEach(item => {
      tiles.push({ pairId: item.id, text: item.term });
      tiles.push({ pairId: item.id, text: item.definition });
    });

    const shuffled = this.shuffleArray(tiles);
    this.renderMatrix(shuffled);
    this.startTimer();
  }

  renderMatrix(tiles) {
    if (!this.matrixContainer) return;

    this.matrixContainer.innerHTML = tiles.map((tile, idx) => `
      <div class="matrix-tile" data-index="${idx}" data-pair="${tile.pairId}">
        <span>${this.escapeHtml(tile.text)}</span>
      </div>
    `).join('');

    this.matrixContainer.querySelectorAll('.matrix-tile').forEach(tileEl => {
      tileEl.addEventListener('click', () => this.handleTileClick(tileEl));
    });
  }

  handleTileClick(tileEl) {
    if (this.isProcessing) return;
    if (tileEl.classList.contains('matched') || tileEl.classList.contains('selected')) return;

    tileEl.classList.add('selected');

    if (!this.firstSelected) {
      this.firstSelected = tileEl;
    } else {
      this.secondSelected = tileEl;
      this.checkPair();
    }
  }

  checkPair() {
    this.isProcessing = true;
    const pair1 = this.firstSelected.dataset.pair;
    const pair2 = this.secondSelected.dataset.pair;

    if (pair1 === pair2) {
      const t1 = this.firstSelected;
      const t2 = this.secondSelected;

      setTimeout(() => {
        t1.classList.remove('selected');
        t2.classList.remove('selected');
        t1.classList.add('matched');
        t2.classList.add('matched');

        this.matchedPairsCount++;
        this.firstSelected = null;
        this.secondSelected = null;
        this.isProcessing = false;

        if (this.matchedPairsCount >= this.totalPairs) {
          this.handleWin();
        }
      }, 150);
    } else {
      const t1 = this.firstSelected;
      const t2 = this.secondSelected;

      t1.classList.add('mismatch');
      t2.classList.add('mismatch');

      setTimeout(() => {
        t1.classList.remove('selected', 'mismatch');
        t2.classList.remove('selected', 'mismatch');
        this.firstSelected = null;
        this.secondSelected = null;
        this.isProcessing = false;
      }, 400);
    }
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = (Date.now() - this.startTime) / 1000;
      this.updateTimerDisplay(this.elapsedSeconds);
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay(seconds) {
    if (this.clockEl) {
      this.clockEl.textContent = `${seconds.toFixed(1)}s`;
    }
  }

  handleWin() {
    this.stopTimer();
    const finalScore = this.elapsedSeconds;
    const isNewRecord = this.storage.saveBestMatchTime(this.currentSet.id, finalScore);
    this.updateBestDisplay();

    if (isNewRecord) {
      this.toast(`🏆 New Personal Record: ${finalScore.toFixed(1)}s!`);
    } else {
      this.toast(`Cleared in ${finalScore.toFixed(1)}s!`);
    }
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
