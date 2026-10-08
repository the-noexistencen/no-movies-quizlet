// ==========================================================================
// Main Application Controller & View Router
// ==========================================================================

import { ThemeManager } from './theme.js';
import { StorageService } from './storage.js';
import { FlashcardsController } from './flashcards.js';
import { LearnController } from './learn.js';
import { MatchController } from './match.js';
import { SetEditorController } from './set-editor.js';

class App {
  constructor() {
    this.themeManager = new ThemeManager();
    this.storage = new StorageService();
    this.activeSetId = null;
    this.currentView = 'dashboard';

    this.flashcards = new FlashcardsController(this.storage);
    this.learn = new LearnController(this.storage);
    this.match = new MatchController(this.storage);
    this.editor = new SetEditorController(this.storage, (savedId) => {
      this.renderDashboard();
      if (savedId) {
        this.switchView('flashcards', savedId);
      } else {
        this.switchView('dashboard');
      }
    });

    this.initElements();
    this.bindEvents();
    this.renderDashboard();
  }

  initElements() {
    this.brandLogo = document.getElementById('brandLogo');
    this.btnNewSet = document.getElementById('headerBtnNewSet');
    this.navTabFlashcards = document.getElementById('navTabFlashcards');
    this.navTabLearn = document.getElementById('navTabLearn');
    this.navTabMatch = document.getElementById('navTabMatch');
    this.navTabsWrap = document.getElementById('navTabsWrap');

    this.viewDashboard = document.getElementById('viewDashboard');
    this.viewFlashcards = document.getElementById('viewFlashcards');
    this.viewLearn = document.getElementById('viewLearn');
    this.viewMatch = document.getElementById('viewMatch');
    this.viewEditor = document.getElementById('viewEditor');

    this.setsGrid = document.getElementById('setsGrid');
  }

  bindEvents() {
    if (this.brandLogo) {
      this.brandLogo.addEventListener('click', () => this.switchView('dashboard'));
    }

    if (this.btnNewSet) {
      this.btnNewSet.addEventListener('click', () => {
        this.editor.openNewSet();
        this.switchView('editor');
      });
    }

    if (this.navTabFlashcards) {
      this.navTabFlashcards.addEventListener('click', () => {
        if (this.activeSetId) this.switchView('flashcards', this.activeSetId);
      });
    }

    if (this.navTabLearn) {
      this.navTabLearn.addEventListener('click', () => {
        if (this.activeSetId) this.switchView('learn', this.activeSetId);
      });
    }

    if (this.navTabMatch) {
      this.navTabMatch.addEventListener('click', () => {
        if (this.activeSetId) this.switchView('match', this.activeSetId);
      });
    }

    // "Back to Sets" buttons in each study mode
    document.querySelectorAll('.back-to-sets-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchView('dashboard'));
    });
  }

  renderDashboard() {
    if (!this.setsGrid) return;
    const sets = this.storage.getAllSets();

    this.setsGrid.innerHTML = sets.map(set => {
      const termCount = set.terms ? set.terms.length : 0;
      const bestTime = this.storage.getBestMatchTime(set.id);
      const bestTimeBadge = bestTime !== null ? `⏱️ Best: ${bestTime.toFixed(1)}s` : '';

      return `
        <div class="set-card" data-set-id="${set.id}">
          <div class="set-card-header">
            <h3 class="set-title">${this.escapeHtml(set.title)}</h3>
            <p class="set-desc">${this.escapeHtml(set.description || 'No description provided.')}</p>
          </div>
          <div>
            <div class="set-meta">
              <span>${termCount} cards</span>
              <span>${bestTimeBadge}</span>
            </div>
            <div class="set-card-actions">
              <button class="btn btn-primary btn-sm study-deck-btn" data-set-id="${set.id}">Study</button>
              <button class="btn btn-secondary btn-sm edit-deck-btn" data-set-id="${set.id}" title="Edit Set">✏️</button>
              <button class="btn btn-secondary btn-sm export-deck-btn" data-set-id="${set.id}" title="Copy to Clipboard">📋</button>
              <button class="btn btn-danger btn-sm delete-deck-btn" data-set-id="${set.id}" title="Delete Set">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind card action buttons
    this.setsGrid.querySelectorAll('.study-deck-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchView('flashcards', btn.dataset.setId));
    });

    this.setsGrid.querySelectorAll('.edit-deck-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editor.openEditSet(btn.dataset.setId);
        this.switchView('editor');
      });
    });

    this.setsGrid.querySelectorAll('.export-deck-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = this.storage.exportSetAsTSV(btn.dataset.setId);
        navigator.clipboard.writeText(text).then(() => {
          alert('Study set terms copied to clipboard in Quizlet format!');
        });
      });
    });

    this.setsGrid.querySelectorAll('.delete-deck-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const set = this.storage.getSet(btn.dataset.setId);
        if (confirm(`Are you sure you want to delete "${set.title}"?`)) {
          this.storage.deleteSet(btn.dataset.setId);
          this.renderDashboard();
        }
      });
    });
  }

  switchView(viewName, setId = null) {
    this.currentView = viewName;
    if (setId) this.activeSetId = setId;

    // Toggle nav tabs visibility based on whether a set is active
    if (this.navTabsWrap) {
      this.navTabsWrap.style.display = (viewName === 'dashboard' || viewName === 'editor') ? 'none' : 'flex';
    }

    // Update active nav tab
    [this.navTabFlashcards, this.navTabLearn, this.navTabMatch].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });

    if (viewName === 'flashcards' && this.navTabFlashcards) this.navTabFlashcards.classList.add('active');
    if (viewName === 'learn' && this.navTabLearn) this.navTabLearn.classList.add('active');
    if (viewName === 'match' && this.navTabMatch) this.navTabMatch.classList.add('active');

    // Hide all views
    [this.viewDashboard, this.viewFlashcards, this.viewLearn, this.viewMatch, this.viewEditor].forEach(view => {
      if (view) view.classList.remove('active');
    });

    // Update top title badges for study views
    if (this.activeSetId && (viewName === 'flashcards' || viewName === 'learn' || viewName === 'match')) {
      const activeSet = this.storage.getSet(this.activeSetId);
      if (activeSet) {
        document.querySelectorAll('.activeDeckTitle').forEach(el => el.textContent = activeSet.title);
        document.querySelectorAll('.activeDeckCount').forEach(el => el.textContent = `${activeSet.terms.length} cards`);
      }
    }

    // Show selected view
    switch (viewName) {
      case 'dashboard':
        if (this.viewDashboard) this.viewDashboard.classList.add('active');
        this.renderDashboard();
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        break;

      case 'flashcards':
        if (this.viewFlashcards) this.viewFlashcards.classList.add('active');
        this.match.stopTimer();
        this.flashcards.loadSet(this.activeSetId);
        break;

      case 'learn':
        if (this.viewLearn) this.viewLearn.classList.add('active');
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        this.learn.loadSet(this.activeSetId);
        break;

      case 'match':
        if (this.viewMatch) this.viewMatch.classList.add('active');
        this.flashcards.detachKeyboard();
        this.match.loadSet(this.activeSetId);
        break;

      case 'editor':
        if (this.viewEditor) this.viewEditor.classList.add('active');
        this.flashcards.detachKeyboard();
        this.match.stopTimer();
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
