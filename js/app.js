// ==========================================================================
// Main Application Controller
// Simplified UI matching netanyahu-s-final-order layout
// ==========================================================================

import { ThemeManager } from './theme.js';
import { StorageService } from './storage.js';
import { FlashcardsController } from './flashcards.js';
import { LearnController } from './learn.js';
import { MatchController } from './match.js';
import { SetEditorController } from './set-editor.js';

class App {
  constructor() {
    this.toastTimer = null;
    this.storage = new StorageService();
    this.themeManager = new ThemeManager(this.toast.bind(this));

    this.activeSetId = null;
    this.currentTab = 'decks';

    this.flashcards = new FlashcardsController(this.storage, this.toast.bind(this));
    this.learn = new LearnController(this.storage, this.toast.bind(this));
    this.match = new MatchController(this.storage, this.toast.bind(this));

    this.editor = new SetEditorController(this.storage, (savedId) => {
      this.renderDecksList();
      if (savedId) {
        this.activeSetId = savedId;
        this.switchTab('flashcards');
      } else {
        this.switchTab('decks');
      }
    }, this.toast.bind(this));

    this.initElements();
    this.bindEvents();

    // Default active set to first deck
    const sets = this.storage.getAllSets();
    if (sets.length > 0) {
      this.activeSetId = sets[0].id;
    }

    this.renderDecksList();
    this.updateHeaderStats();
  }

  toast(message) {
    const toastEl = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toastEl || !toastMsg) return;

    toastMsg.textContent = message;
    toastEl.classList.add('show');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2000);
  }

  initElements() {
    // Header
    this.headerSubtitle = document.getElementById('appHeaderSubtitle');
    this.headerNewBtn = document.getElementById('headerNewBtn');

    // Tabs
    this.tabDecks = document.getElementById('tabDecks');
    this.tabFlashcards = document.getElementById('tabFlashcards');
    this.tabLearn = document.getElementById('tabLearn');
    this.tabMatch = document.getElementById('tabMatch');
    this.tabSettings = document.getElementById('tabSettings');

    // Views
    this.decksView = document.getElementById('decksView');
    this.flashcardsView = document.getElementById('flashcardsView');
    this.learnView = document.getElementById('learnView');
    this.matchView = document.getElementById('matchView');
    this.settingsView = document.getElementById('settingsView');
    this.editorView = document.getElementById('editorView');

    // Decks View controls
    this.searchInput = document.getElementById('searchInput');
    this.quickActionStudy = document.getElementById('quickActionStudy');
    this.quickActionImport = document.getElementById('quickActionImport');
    this.emptyDecks = document.getElementById('emptyDecks');
    this.emptyNewBtn = document.getElementById('emptyNewBtn');
    this.decksList = document.getElementById('decksList');

    // Settings counts
    this.settingsDecksCount = document.getElementById('settingsDecksCount');
    this.settingsCardsCount = document.getElementById('settingsCardsCount');
  }

  bindEvents() {
    // Tab Switching
    if (this.tabDecks) this.tabDecks.addEventListener('click', () => this.switchTab('decks'));
    if (this.tabFlashcards) this.tabFlashcards.addEventListener('click', () => this.switchTab('flashcards'));
    if (this.tabLearn) this.tabLearn.addEventListener('click', () => this.switchTab('learn'));
    if (this.tabMatch) this.tabMatch.addEventListener('click', () => this.switchTab('match'));
    if (this.tabSettings) this.tabSettings.addEventListener('click', () => this.switchTab('settings'));

    // Header Actions
    if (this.headerNewBtn) {
      this.headerNewBtn.addEventListener('click', () => {
        this.editor.openNew();
        this.switchTab('editor');
      });
    }

    if (this.emptyNewBtn) {
      this.emptyNewBtn.addEventListener('click', () => {
        this.editor.openNew();
        this.switchTab('editor');
      });
    }

    // Quick Actions
    if (this.quickActionStudy) {
      this.quickActionStudy.addEventListener('click', () => {
        if (this.activeSetId) {
          this.switchTab('flashcards');
        } else {
          this.toast('Select a deck to study');
        }
      });
    }

    if (this.quickActionImport) {
      this.quickActionImport.addEventListener('click', () => {
        this.editor.openImportModal();
      });
    }

    // Search filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.renderDecksList(this.searchInput.value.trim().toLowerCase());
      });
    }
  }

  updateHeaderStats() {
    const sets = this.storage.getAllSets();
    const totalDecks = sets.length;
    const totalCards = sets.reduce((acc, s) => acc + (s.terms ? s.terms.length : 0), 0);

    if (this.headerSubtitle) {
      this.headerSubtitle.textContent = `${totalDecks} decks • ${totalCards} cards`;
    }

    if (this.settingsDecksCount) this.settingsDecksCount.textContent = totalDecks;
    if (this.settingsCardsCount) this.settingsCardsCount.textContent = totalCards;
  }

  renderDecksList(query = '') {
    if (!this.decksList) return;
    const allSets = this.storage.getAllSets();

    const filtered = allSets.filter(s => {
      if (!query) return true;
      const titleMatch = s.title.toLowerCase().includes(query);
      const descMatch = (s.description || '').toLowerCase().includes(query);
      const termMatch = s.terms && s.terms.some(t => t.term.toLowerCase().includes(query) || t.definition.toLowerCase().includes(query));
      return titleMatch || descMatch || termMatch;
    });

    if (allSets.length === 0) {
      this.emptyDecks.style.display = 'flex';
      this.decksList.style.display = 'none';
      return;
    } else {
      this.emptyDecks.style.display = 'none';
      this.decksList.style.display = 'flex';
    }

    this.decksList.innerHTML = filtered.map(set => {
      const cardCount = set.terms ? set.terms.length : 0;
      const best = this.storage.getBestMatchTime(set.id);
      const bestBadge = best !== null ? ` • Match: ${best.toFixed(1)}s` : '';
      const isSelected = set.id === this.activeSetId;

      return `
        <div class="deck-item" data-id="${set.id}" style="${isSelected ? 'background: var(--bg-surface); padding-left: 8px; padding-right: 8px; border-radius: 6px;' : ''}">
          <div class="deck-info">
            <div class="deck-title">${this.escapeHtml(set.title)}</div>
            <div class="deck-subtitle">${cardCount} cards${bestBadge}</div>
          </div>
          <div class="deck-actions">
            <button class="icon-btn study-btn" title="Study">Study</button>
            <button class="icon-btn edit-btn" title="Edit">✏️</button>
            <button class="icon-btn copy-btn" title="Copy Terms">📋</button>
            <button class="icon-btn delete-btn" title="Delete" style="color: var(--danger);">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach row events
    this.decksList.querySelectorAll('.deck-item').forEach(item => {
      const setId = item.dataset.id;

      item.querySelector('.deck-info').addEventListener('click', () => {
        this.activeSetId = setId;
        this.switchTab('flashcards');
      });

      item.querySelector('.study-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeSetId = setId;
        this.switchTab('flashcards');
      });

      item.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.editor.openEdit(setId);
        this.switchTab('editor');
      });

      item.querySelector('.copy-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const text = this.storage.exportSetAsTSV(setId);
        navigator.clipboard.writeText(text).then(() => {
          this.toast('Terms copied to clipboard');
        });
      });

      item.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const set = this.storage.getSet(setId);
        if (confirm(`Delete "${set.title}"?`)) {
          this.storage.deleteSet(setId);
          if (this.activeSetId === setId) {
            const remaining = this.storage.getAllSets();
            this.activeSetId = remaining.length > 0 ? remaining[0].id : null;
          }
          this.renderDecksList();
          this.updateHeaderStats();
          this.toast('Deck deleted');
        }
      });
    });

    this.updateHeaderStats();
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update active tab buttons
    [this.tabDecks, this.tabFlashcards, this.tabLearn, this.tabMatch, this.tabSettings].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });

    if (tabName === 'decks' && this.tabDecks) this.tabDecks.classList.add('active');
    if (tabName === 'flashcards' && this.tabFlashcards) this.tabFlashcards.classList.add('active');
    if (tabName === 'learn' && this.tabLearn) this.tabLearn.classList.add('active');
    if (tabName === 'match' && this.tabMatch) this.tabMatch.classList.add('active');
    if (tabName === 'settings' && this.tabSettings) this.tabSettings.classList.add('active');

    // Hide all views
    [this.decksView, this.flashcardsView, this.learnView, this.matchView, this.settingsView, this.editorView].forEach(v => {
      if (v) v.style.display = 'none';
    });

    // Ensure we have an active deck when entering study tabs
    if (!this.activeSetId && (tabName === 'flashcards' || tabName === 'learn' || tabName === 'match')) {
      const sets = this.storage.getAllSets();
      if (sets.length > 0) {
        this.activeSetId = sets[0].id;
      }
    }

    // Show active view
    switch (tabName) {
      case 'decks':
        if (this.decksView) this.decksView.style.display = 'block';
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        this.renderDecksList();
        break;

      case 'flashcards':
        if (this.flashcardsView) this.flashcardsView.style.display = 'block';
        this.match.stopTimer();
        if (this.activeSetId) this.flashcards.loadSet(this.activeSetId);
        break;

      case 'learn':
        if (this.learnView) this.learnView.style.display = 'block';
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        if (this.activeSetId) this.learn.loadSet(this.activeSetId);
        break;

      case 'match':
        if (this.matchView) this.matchView.style.display = 'block';
        this.flashcards.detachKeyboard();
        if (this.activeSetId) this.match.loadSet(this.activeSetId);
        break;

      case 'settings':
        if (this.settingsView) this.settingsView.style.display = 'block';
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        this.updateHeaderStats();
        break;

      case 'editor':
        if (this.editorView) this.editorView.style.display = 'block';
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        break;
    }

    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.scrollTop = 0;
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
