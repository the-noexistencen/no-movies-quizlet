// ==========================================================================
// Flashcards Feature (3D Card Flip, Navigation, Starred Filter)
// Pure button-driven UI, zero emojis
// ==========================================================================

export class FlashcardsController {
  constructor(storageService, toastFn) {
    this.storage = storageService;
    this.toast = toastFn || console.log;
    this.currentSet = null;
    this.cards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.starredOnly = false;
    this.termFirst = true;

    this.boundKeyHandler = this.handleKeydown.bind(this);
    this.initElements();
  }

  initElements() {
    this.stage = document.getElementById('fcStage');
    this.cardInner = document.getElementById('fcCardInner');
    this.frontText = document.getElementById('fcFrontText');
    this.backText = document.getElementById('fcBackText');
    this.frontTag = document.getElementById('fcFrontTag');
    this.backTag = document.getElementById('fcBackTag');
    this.starBtn = document.getElementById('fcStarBtn');
    this.prevBtn = document.getElementById('fcPrev');
    this.nextBtn = document.getElementById('fcNext');
    this.counterEl = document.getElementById('fcCounter');
    this.deckTitleEl = document.getElementById('fcDeckTitle');
    this.deckCountEl = document.getElementById('fcDeckCount');

    this.swapSidesBtn = document.getElementById('fcSwapSides');
    this.shuffleBtn = document.getElementById('fcShuffle');
    this.starredOnlyBtn = document.getElementById('fcStarredOnly');

    this.bindEvents();
  }

  bindEvents() {
    if (this.stage) {
      this.stage.addEventListener('click', (e) => {
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

    if (this.starredOnlyBtn) {
      this.starredOnlyBtn.addEventListener('click', () => {
        this.starredOnly = !this.starredOnly;
        this.starredOnlyBtn.classList.toggle('primary', this.starredOnly);
        this.starredOnlyBtn.textContent = this.starredOnly ? 'Show All' : 'Starred Only';
        this.reloadDeck();
      });
    }
  }

  loadSet(setId) {
    this.currentSet = this.storage.getSet(setId);
    if (!this.currentSet) return;

    if (this.deckTitleEl) this.deckTitleEl.textContent = this.currentSet.title;
    if (this.deckCountEl) this.deckCountEl.textContent = `${this.currentSet.terms.length} cards`;

    this.starredOnly = false;
    if (this.starredOnlyBtn) {
      this.starredOnlyBtn.classList.remove('primary');
      this.starredOnlyBtn.textContent = 'Starred Only';
    }

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

  updateCardView() {
    if (this.cardInner) {
      this.cardInner.classList.toggle('flipped', this.isFlipped);
    }

    if (!this.cards || this.cards.length === 0) {
      if (this.frontText) this.frontText.textContent = this.starredOnly ? 'No starred cards yet' : 'Empty deck';
      if (this.backText) this.backText.textContent = this.starredOnly ? 'Star cards while studying to review them here.' : 'Add cards to this deck';
      if (this.counterEl) this.counterEl.textContent = '0 / 0';
      if (this.starBtn) this.starBtn.style.display = 'none';
      if (this.prevBtn) this.prevBtn.disabled = true;
      if (this.nextBtn) this.nextBtn.disabled = true;
      return;
    }

    if (this.starBtn) this.starBtn.style.display = 'block';

    const card = this.cards[this.currentIndex];
    const front = this.termFirst ? card.term : card.definition;
    const back = this.termFirst ? card.definition : card.term;

    if (this.frontText) this.frontText.textContent = front;
    if (this.backText) this.backText.textContent = back;

    if (this.frontTag) this.frontTag.textContent = this.termFirst ? 'TERM' : 'DEFINITION';
    if (this.backTag) this.backTag.textContent = this.termFirst ? 'DEFINITION' : 'TERM';

    // Pure text button for star
    if (this.starBtn) {
      this.starBtn.textContent = card.starred ? 'Starred' : 'Star';
      this.starBtn.classList.toggle('starred', card.starred);
    }

    const total = this.cards.length;
    const currentNum = this.currentIndex + 1;
    if (this.counterEl) this.counterEl.textContent = `${currentNum} / ${total}`;

    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentIndex === total - 1;
  }

  flip() {
    if (!this.cards || this.cards.length === 0) return;
    this.isFlipped = !this.isFlipped;
    if (this.cardInner) {
      this.cardInner.classList.toggle('flipped', this.isFlipped);
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
    this.toast('Deck shuffled');
  }

  toggleSides() {
    this.termFirst = !this.termFirst;
    if (this.swapSidesBtn) {
      this.swapSidesBtn.textContent = this.termFirst ? 'Swap Sides' : 'Inverted';
    }
    this.updateCardView();
  }

  toggleStarCurrent() {
    if (!this.cards || this.cards.length === 0) return;
    const card = this.cards[this.currentIndex];
    const newStarred = this.storage.toggleStar(this.currentSet.id, card.id);
    card.starred = newStarred;

    this.currentSet = this.storage.getSet(this.currentSet.id);
    this.updateCardView();
    this.toast(newStarred ? 'Card starred' : 'Card unstarred');
  }

  handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const fcView = document.getElementById('flashcardsView');
    if (!fcView || fcView.style.display === 'none') return;

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
