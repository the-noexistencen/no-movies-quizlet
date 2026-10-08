// ==========================================================================
// Set Creator & Editor Module (Dynamic Term Rows & Quizlet Quick Import)
// ==========================================================================

import { StorageService } from './storage.js';

export class SetEditorController {
  constructor(storageService, onSavedCallback) {
    this.storage = storageService;
    this.onSaved = onSavedCallback;
    this.editingSetId = null;

    this.initElements();
  }

  initElements() {
    this.titleInput = document.getElementById('editorTitle');
    this.descInput = document.getElementById('editorDesc');
    this.rowsContainer = document.getElementById('editorTermRows');
    this.addRowBtn = document.getElementById('editorAddRowBtn');
    this.saveBtn = document.getElementById('editorSaveBtn');
    this.cancelBtn = document.getElementById('editorCancelBtn');
    this.quickImportBtn = document.getElementById('editorQuickImportBtn');

    // Import modal
    this.importModal = document.getElementById('quickImportModal');
    this.importTextarea = document.getElementById('importTextarea');
    this.importSubmitBtn = document.getElementById('importSubmitBtn');
    this.importCancelBtn = document.getElementById('importCancelBtn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.addRowBtn) {
      this.addRowBtn.addEventListener('click', () => this.addTermRow());
    }

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveCurrentSet());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        if (this.onSaved) this.onSaved(null);
      });
    }

    if (this.quickImportBtn) {
      this.quickImportBtn.addEventListener('click', () => {
        if (this.importTextarea) this.importTextarea.value = '';
        if (this.importModal) this.importModal.classList.add('show');
      });
    }

    if (this.importCancelBtn) {
      this.importCancelBtn.addEventListener('click', () => {
        if (this.importModal) this.importModal.classList.remove('show');
      });
    }

    if (this.importSubmitBtn) {
      this.importSubmitBtn.addEventListener('click', () => this.handleImportSubmit());
    }
  }

  openNewSet() {
    this.editingSetId = null;
    if (this.titleInput) this.titleInput.value = '';
    if (this.descInput) this.descInput.value = '';
    if (this.rowsContainer) this.rowsContainer.innerHTML = '';

    // Seed 4 empty rows by default
    for (let i = 0; i < 4; i++) {
      this.addTermRow();
    }
  }

  openEditSet(setId) {
    const set = this.storage.getSet(setId);
    if (!set) return;

    this.editingSetId = setId;
    if (this.titleInput) this.titleInput.value = set.title;
    if (this.descInput) this.descInput.value = set.description || '';
    if (this.rowsContainer) this.rowsContainer.innerHTML = '';

    if (set.terms && set.terms.length > 0) {
      set.terms.forEach(t => this.addTermRow(t.term, t.definition, t.id, t.starred));
    } else {
      this.addTermRow();
    }
  }

  addTermRow(term = '', definition = '', id = null, starred = false) {
    if (!this.rowsContainer) return;
    const termId = id || `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const row = document.createElement('div');
    row.className = 'term-row';
    row.dataset.id = termId;
    row.dataset.starred = starred ? 'true' : 'false';

    row.innerHTML = `
      <input type="text" class="form-input term-input" placeholder="Enter Term..." value="${this.escapeHtml(term)}" required />
      <input type="text" class="form-input def-input" placeholder="Enter Definition..." value="${this.escapeHtml(definition)}" required />
      <button type="button" class="btn btn-ghost btn-danger btn-icon remove-row-btn" title="Delete Row">✕</button>
    `;

    row.querySelector('.remove-row-btn').addEventListener('click', () => {
      row.remove();
    });

    // Auto-add new row when pressing Tab on definition of the last row
    const defInput = row.querySelector('.def-input');
    defInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        const allRows = this.rowsContainer.querySelectorAll('.term-row');
        if (allRows[allRows.length - 1] === row) {
          setTimeout(() => this.addTermRow(), 20);
        }
      }
    });

    this.rowsContainer.appendChild(row);
  }

  handleImportSubmit() {
    if (!this.importTextarea) return;
    const text = this.importTextarea.value.trim();
    if (!text) return;

    const parsed = StorageService.parseQuizletText(text);
    if (parsed.length === 0) {
      alert('Could not parse any terms. Ensure each line has a term and definition separated by tab, comma, or dash.');
      return;
    }

    parsed.forEach(t => {
      this.addTermRow(t.term, t.definition, t.id, t.starred);
    });

    if (this.importModal) this.importModal.classList.remove('show');
  }

  saveCurrentSet() {
    const title = this.titleInput ? this.titleInput.value.trim() : '';
    const description = this.descInput ? this.descInput.value.trim() : '';

    if (!title) {
      alert('Please provide a title for your study set.');
      if (this.titleInput) this.titleInput.focus();
      return;
    }

    const rows = this.rowsContainer ? this.rowsContainer.querySelectorAll('.term-row') : [];
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
      alert('A study set needs at least 2 complete term & definition pairs.');
      return;
    }

    const setData = {
      id: this.editingSetId,
      title,
      description,
      terms
    };

    const saved = this.storage.saveSet(setData);
    if (this.onSaved) {
      this.onSaved(saved.id);
    }
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
