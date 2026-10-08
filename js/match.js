// ==========================================================================
// Match Feature (Timed Memory Tile Matching Game, Live Stopwatch & High Scores)
// ==========================================================================

export class MatchController {
  constructor(storageService) {
    this.storage = storageService;
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
    this.stopwatchEl = document.getElementById('matchStopwatch');
    this.bestRecordEl = document.getElementById('matchBestRecord');
    this.gridContainer = document.getElementById('matchGrid');
    this.restartBtn = document.getElementById('matchRestartBtn');
    
    this.victoryModal = document.getElementById('matchVictoryModal');
    this.finalTimeEl = document.getElementById('matchFinalTime');
    this.recordBadgeEl = document.getElementById('matchRecordBadge');
    this.modalPlayAgainBtn = document.getElementById('matchPlayAgainBtn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.startNewGame());
    }

    if (this.modalPlayAgainBtn) {
      this.modalPlayAgainBtn.addEventListener('click', () => {
        if (this.victoryModal) this.victoryModal.classList.remove('show');
        this.startNewGame();
      });
    }
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;
    this.updateBestRecordDisplay();
    this.startNewGame();
  }

  updateBestRecordDisplay() {
    if (!this.bestRecordEl || !this.currentSet) return;
    const best = this.storage.getBestMatchTime(this.currentSet.id);
    if (best !== null) {
      this.bestRecordEl.textContent = `Best: ${best.toFixed(1)}s`;
    } else {
      this.bestRecordEl.textContent = 'Best: --';
    }
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
      if (this.gridContainer) this.gridContainer.innerHTML = '<p>No terms available for match.</p>';
      return;
    }

    // Pick up to 6 pairs (12 tiles total) for optimal quick-paced desktop and mobile play
    const availableTerms = [...this.currentSet.terms];
    const pairsToUse = this.shuffleArray(availableTerms).slice(0, 6);
    this.totalPairs = pairsToUse.length;

    // Create tile objects: half terms, half definitions
    const tiles = [];
    pairsToUse.forEach(item => {
      tiles.push({
        pairId: item.id,
        type: 'term',
        text: item.term
      });
      tiles.push({
        pairId: item.id,
        type: 'definition',
        text: item.definition
      });
    });

    const shuffledTiles = this.shuffleArray(tiles);
    this.renderGrid(shuffledTiles);
    this.startTimer();
  }

  renderGrid(tiles) {
    if (!this.gridContainer) return;

    this.gridContainer.innerHTML = tiles.map((tile, idx) => `
      <div class="match-tile" data-index="${idx}" data-pair="${tile.pairId}">
        <span>${tile.text}</span>
      </div>
    `).join('');

    this.gridContainer.querySelectorAll('.match-tile').forEach(tileEl => {
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
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isProcessing = true;
    const pair1 = this.firstSelected.dataset.pair;
    const pair2 = this.secondSelected.dataset.pair;

    if (pair1 === pair2) {
      // MATCH!
      const tile1 = this.firstSelected;
      const tile2 = this.secondSelected;

      setTimeout(() => {
        tile1.classList.remove('selected');
        tile2.classList.remove('selected');
        tile1.classList.add('matched');
        tile2.classList.add('matched');

        this.matchedPairsCount++;
        this.firstSelected = null;
        this.secondSelected = null;
        this.isProcessing = false;

        if (this.matchedPairsCount >= this.totalPairs) {
          this.handleGameOver();
        }
      }, 200);
    } else {
      // MISMATCH!
      const tile1 = this.firstSelected;
      const tile2 = this.secondSelected;

      tile1.classList.add('mismatch');
      tile2.classList.add('mismatch');

      setTimeout(() => {
        tile1.classList.remove('selected', 'mismatch');
        tile2.classList.remove('selected', 'mismatch');
        this.firstSelected = null;
        this.secondSelected = null;
        this.isProcessing = false;
      }, 500);
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
    if (this.stopwatchEl) {
      this.stopwatchEl.textContent = `${seconds.toFixed(1)}s`;
    }
  }

  handleGameOver() {
    this.stopTimer();
    const finalScore = this.elapsedSeconds;
    const isNewRecord = this.storage.saveBestMatchTime(this.currentSet.id, finalScore);

    this.updateBestRecordDisplay();

    if (this.finalTimeEl) {
      this.finalTimeEl.textContent = `${finalScore.toFixed(1)}s`;
    }

    if (this.recordBadgeEl) {
      this.recordBadgeEl.style.display = isNewRecord ? 'inline-block' : 'none';
    }

    if (this.victoryModal) {
      this.victoryModal.classList.add('show');
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
}
