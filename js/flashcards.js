// ==========================================================================
// Flashcards Feature (3D Card Flip, Navigation, Keyboard Shortcuts, Stars)
// ==========================================================================

export class FlashcardsController {
  constructor(storageService) {
    this.storage = storageService;
    this.currentSet = null;
    this.cards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.starredOnly = false;
    this.termFirst = true; // true: Term on front, false: Definition on front
    this.boundKeyHandler = this.handleKeydown.bind(this);
    this.initElements();
  }

  initElements() {
    this.stage = document.getElementById('fcStage');
    this.cardInner = document.getElementById('fcCardInner');
    this.frontText = document.getElementById('fcFrontText');
    this.backText = document.getElementById('fcBackText');
    this.frontBadge = document.getElementById('fcFrontBadge');
    this.backBadge = document.getElementById('fcBackBadge');
    this.starBtn = document.getElementById('fcStarBtn');
    this.prevBtn = document.getElementById('fcPrevBtn');
    this.nextBtn = document.getElementById('fcNextBtn');
    this.counterEl = document.getElementById('fcCounter');
    this.progressBar = document.getElementById('fcProgressFill');
    this.shuffleBtn = document.getElementById('fcShuffleBtn');
    this.swapSidesBtn = document.getElementById('fcSwapSidesBtn');
    this.filterAllBtn = document.getElementById('fcFilterAll');
    this.filterStarredBtn = document.getElementById('fcFilterStarred');

    this.bindEvents();
  }

  bindEvents() {
    if (this.stage) {
      this.stage.addEventListener('click', (e) => {
        // Avoid flip if clicking the star button
        if (e.target.closest('#fcStarBtn')) return;
        this.flip();
      });
    }

    if (this.starBtn) {
      this.starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleStarCurrent();
      });
    }

    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevCard());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextCard());
    if (this.shuffleBtn) this.shuffleBtn.addEventListener('click', () => this.shuffle());
    if (this.swapSidesBtn) this.swapSidesBtn.addEventListener('click', () => this.toggleSides());

    if (this.filterAllBtn) {
      this.filterAllBtn.addEventListener('click', () => {
        this.starredOnly = false;
        this.updateFilterButtons();
        this.reloadDeck();
      });
    }

    if (this.filterStarredBtn) {
      this.filterStarredBtn.addEventListener('click', () => {
        this.starredOnly = true;
        this.updateFilterButtons();
        this.reloadDeck();
      });
    }
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;

    this.starredOnly = false;
    this.updateFilterButtons();
    this.reloadDeck();
    this.attachKeyboard();
  }

  reloadDeck() {
    if (!this.currentSet) return;
    const allCards = [...this.currentSet.terms];

    if (this.starredOnly) {
      this.cards = allCards.filter(c => c.starred);
    } else {
      this.cards = allCards;
    }

    this.currentIndex = 0;
    this.isFlipped = false;
    this.updateCardView();
  }

  updateFilterButtons() {
    if (!this.currentSet) return;
    const totalCount = this.currentSet.terms.length;
    const starredCount = this.currentSet.terms.filter(t => t.starred).length;

    if (this.filterAllBtn) {
      this.filterAllBtn.textContent = `All (${totalCount})`;
      this.filterAllBtn.classList.toggle('active', !this.starredOnly);
    }

    if (this.filterStarredBtn) {
      this.filterStarredBtn.textContent = `★ Starred (${starredCount})`;
      this.filterStarredBtn.classList.toggle('active', this.starredOnly);
    }
  }

  updateCardView() {
    if (this.cardInner) {
      this.cardInner.classList.toggle('is-flipped', this.isFlipped);
    }

    if (!this.cards || this.cards.length === 0) {
      if (this.frontText) this.frontText.textContent = this.starredOnly ? 'No starred terms yet!' : 'This deck is empty.';
      if (this.backText) this.backText.textContent = this.starredOnly ? 'Star terms while studying to review them here.' : 'Add terms in the editor.';
      if (this.counterEl) this.counterEl.textContent = '0 / 0';
      if (this.progressBar) this.progressBar.style.width = '0%';
      if (this.starBtn) this.starBtn.style.display = 'none';
      return;
    }

    if (this.starBtn) this.starBtn.style.display = 'block';

    const card = this.cards[this.currentIndex];
    const frontContent = this.termFirst ? card.term : card.definition;
    const backContent = this.termFirst ? card.definition : card.term;

    if (this.frontText) this.frontText.textContent = frontContent;
    if (this.backText) this.backText.textContent = backContent;

    if (this.frontBadge) this.frontBadge.textContent = this.termFirst ? 'TERM' : 'DEFINITION';
    if (this.backBadge) this.backBadge.textContent = this.termFirst ? 'DEFINITION' : 'TERM';

    // Star icon state
    if (this.starBtn) {
      this.starBtn.textContent = card.starred ? '★' : '☆';
      this.starBtn.classList.toggle('starred', card.starred);
    }

    // Counter and Progress
    const total = this.cards.length;
    const currentNum = this.currentIndex + 1;
    if (this.counterEl) this.counterEl.textContent = `${currentNum} / ${total}`;
    if (this.progressBar) {
      const pct = (currentNum / total) * 100;
      this.progressBar.style.width = `${pct}%`;
    }

    // Navigation buttons disabled states
    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === total - 1;
  }

  flip() {
    if (!this.cards || this.cards.length === 0) return;
    this.isFlipped = !this.isFlipped;
    if (this.cardInner) {
      this.cardInner.classList.toggle('is-flipped', this.isFlipped);
    }
  }

  nextCard() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      this.updateCardView();
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
      this.updateCardView();
    }
  }

  shuffle() {
    if (!this.cards || this.cards.length <= 1) return;
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.currentIndex = 0;
    this.isFlipped = false;
    this.updateCardView();
  }

  toggleSides() {
    this.termFirst = !this.termFirst;
    if (this.swapSidesBtn) {
      this.swapSidesBtn.textContent = this.termFirst ? '⇄ Swap (Term first)' : '⇄ Swap (Def first)';
    }
    this.updateCardView();
  }

  toggleStarCurrent() {
    if (!this.cards || this.cards.length === 0) return;
    const card = this.cards[this.currentIndex];
    const newStarred = this.storage.toggleStar(this.currentSet.id, card.id);
    card.starred = newStarred;

    // Refresh currentSet reference
    this.currentSet = this.storage.getSet(this.currentSet.id);
    this.updateFilterButtons();
    this.updateCardView();
  }

  handleKeydown(e) {
    // Ignore keystrokes if typing inside an input/textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    // Only handle if Flashcards view is active
    const fcView = document.getElementById('viewFlashcards');
    if (!fcView || !fcView.classList.contains('active')) return;

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      this.flip();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.nextCard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevCard();
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.toggleStarCurrent();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.shuffle();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      this.toggleSides();
    }
  }

  attachKeyboard() {
    window.removeEventListener('keydown', this.boundKeyHandler);
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  detachKeyboard() {
    window.removeEventListener('keydown', this.boundKeyHandler);
  }
}
