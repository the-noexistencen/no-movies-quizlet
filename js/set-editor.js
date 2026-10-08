// ==========================================================================
// Set Creator & Editor Module (Minimalist Card Rows & Import Modal)
// ==========================================================================

import { StorageService } from './storage.js';

export class SetEditorController {
  constructor(storageService, onDoneCallback, toastFn) {
    this.storage = storageService;
    this.onDone = onDoneCallback;
    this.toast = toastFn || console.log;
    this.editingSetId = null;

    this.initElements();
  }

  initElements() {
    this.headerTitle = document.getElementById('editorHeaderTitle');
    this.titleInput = document.getElementById('editorTitle');
    this.descInput = document.getElementById('editorDesc');
    this.cardsList = document.getElementById('editorCardsList');
    this.addCardBtn = document.getElementById('editorAddCardBtn');
    this.saveBtn = document.getElementById('editorSaveBtn');
    this.cancelBtn = document.getElementById('editorCancelBtn');

    // Quick Import modal
    this.importModal = document.getElementById('importModal');
    this.importInput = document.getElementById('importInput');
    this.importCancelBtn = document.getElementById('importModalCancel');
    this.importConfirmBtn = document.getElementById('importModalConfirm');

    this.bindEvents();
  }

  bindEvents() {
    if (this.addCardBtn) {
      this.addCardBtn.addEventListener('click', () => this.addCardRow());
    }

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveSet());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        if (this.onDone) this.onDone(null);
      });
    }

    if (this.importCancelBtn) {
      this.importCancelBtn.addEventListener('click', () => {
        if (this.importModal) this.importModal.classList.remove('show');
      });
    }

    if (this.importConfirmBtn) {
      this.importConfirmBtn.addEventListener('click', () => this.handleImport());
    }
  }

  openNew() {
    this.editingSetId = null;
    if (this.headerTitle) this.headerTitle.textContent = 'New Study Set';
    if (this.titleInput) this.titleInput.value = '';
    if (this.descInput) this.descInput.value = '';
    if (this.cardsList) this.cardsList.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      this.addCardRow();
    }
  }

  openEdit(setId) {
    const set = this.storage.getSet(setId);
    if (!set) return;

    this.editingSetId = setId;
    if (this.headerTitle) this.headerTitle.textContent = 'Edit Study Set';
    if (this.titleInput) this.titleInput.value = set.title;
    if (this.descInput) this.descInput.value = set.description || '';
    if (this.cardsList) this.cardsList.innerHTML = '';

    if (set.terms && set.terms.length > 0) {
      set.terms.forEach(t => this.addCardRow(t.term, t.definition, t.id, t.starred));
    } else {
      this.addCardRow();
    }
  }

  openImportModal() {
    if (this.importInput) this.importInput.value = '';
    if (this.importModal) this.importModal.classList.add('show');
  }

  handleImport() {
    if (!this.importInput) return;
    const text = this.importInput.value.trim();
    if (!text) return;

    const parsed = StorageService.parseQuizletText(text);
    if (parsed.length === 0) {
      alert('Could not parse any cards. Separate terms & definitions with tabs, commas, or dashes.');
      return;
    }

    // Create a new set from import
    const newSet = {
      title: `Imported Set (${parsed.length} cards)`,
      description: 'Imported from Quizlet / text data.',
      terms: parsed
    };

    const saved = this.storage.saveSet(newSet);
    if (this.importModal) this.importModal.classList.remove('show');
    this.toast(`Imported ${parsed.length} cards`);
    if (this.onDone) this.onDone(saved.id);
  }

  addCardRow(term = '', definition = '', id = null, starred = false) {
    if (!this.cardsList) return;
    const termId = id || `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const row = document.createElement('div');
    row.className = 'editor-card-row';
    row.dataset.id = termId;
    row.dataset.starred = starred ? 'true' : 'false';

    row.innerHTML = `
      <input type="text" class="form-input term-input" placeholder="Term..." value="${this.escapeHtml(term)}">
      <input type="text" class="form-input def-input" placeholder="Definition..." value="${this.escapeHtml(definition)}">
      <button type="button" class="icon-btn remove-btn" title="Remove" style="color: var(--danger);">✕</button>
    `;

    row.querySelector('.remove-btn').addEventListener('click', () => row.remove());

    const defInput = row.querySelector('.def-input');
    defInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        const rows = this.cardsList.querySelectorAll('.editor-card-row');
        if (rows[rows.length - 1] === row) {
          setTimeout(() => this.addCardRow(), 10);
        }
      }
    });

    this.cardsList.appendChild(row);
  }

  saveSet() {
    const title = this.titleInput ? this.titleInput.value.trim() : '';
    const description = this.descInput ? this.descInput.value.trim() : '';

    if (!title) {
      alert('Please enter a title for the study set.');
      if (this.titleInput) this.titleInput.focus();
      return;
    }

    const rows = this.cardsList ? this.cardsList.querySelectorAll('.editor-card-row') : [];
    const terms = [];

    rows.forEach(r => {
      const termVal = r.querySelector('.term-input').value.trim();
      const defVal = r.querySelector('.def-input').value.trim();
      if (termVal && defVal) {
        terms.push({
          id: r.dataset.id,
          term: termVal,
          definition: defVal,
          starred: r.dataset.starred === 'true'
        });
      }
    });

    if (terms.length < 2) {
      alert('A study set needs at least 2 complete term & definition cards.');
      return;
    }

    const setData = {
      id: this.editingSetId,
      title,
      description,
      terms
    };

    const saved = this.storage.saveSet(setData);
    this.toast(`Saved "${title}"`);
    if (this.onDone) this.onDone(saved.id);
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
