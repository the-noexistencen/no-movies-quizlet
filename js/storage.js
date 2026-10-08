// ==========================================================================
// Storage & Data Layer (LocalStorage CRUD, No Presets, "Term - Definition" Export)
// ==========================================================================

const SETS_STORAGE_KEY = 'no_movies_quizlet_sets_v1';
const HIGH_SCORES_KEY = 'no_movies_quizlet_highscores_v1';

export class StorageService {
  constructor() {
    this.cleanLegacyPresets();
  }

  // Purge any legacy starter presets if present from previous versions
  cleanLegacyPresets() {
    try {
      const existing = localStorage.getItem(SETS_STORAGE_KEY);
      if (existing) {
        let sets = JSON.parse(existing);
        const cleaned = sets.filter(s => !s.id.startsWith('starter-'));
        localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(cleaned));
      } else {
        localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify([]));
      }
    } catch {
      localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify([]));
    }
  }

  getAllSets() {
    try {
      const data = localStorage.getItem(SETS_STORAGE_KEY);
      if (!data) return [];
      const sets = JSON.parse(data);
      return Array.isArray(sets) ? sets.filter(s => !s.id.startsWith('starter-')) : [];
    } catch (e) {
      console.error('Failed to parse sets from localStorage', e);
      return [];
    }
  }

  getSet(id) {
    const sets = this.getAllSets();
    return sets.find(s => s.id === id) || null;
  }

  saveSet(setData) {
    const sets = this.getAllSets();
    const existingIndex = sets.findIndex(s => s.id === setData.id);

    let savedItem;
    if (existingIndex >= 0) {
      savedItem = {
        ...setData,
        updatedAt: Date.now()
      };
      sets[existingIndex] = savedItem;
    } else {
      savedItem = {
        ...setData,
        id: setData.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: Date.now()
      };
      sets.unshift(savedItem);
    }

    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
    return savedItem;
  }

  deleteSet(id) {
    let sets = this.getAllSets();
    sets = sets.filter(s => s.id !== id);
    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
  }

  toggleStar(setId, termId) {
    const set = this.getSet(setId);
    if (!set) return null;

    const term = set.terms.find(t => t.id === termId);
    if (term) {
      term.starred = !term.starred;
      this.saveSet(set);
      return term.starred;
    }
    return false;
  }

  getBestMatchTime(setId) {
    try {
      const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '{}');
      return scores[setId] || null;
    } catch {
      return null;
    }
  }

  saveBestMatchTime(setId, timeSeconds) {
    try {
      const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '{}');
      const currentBest = scores[setId];
      if (currentBest === undefined || timeSeconds < currentBest) {
        scores[setId] = timeSeconds;
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Export terms formatted as "Term - Definition" (one per line)
  exportSetFormatted(setId) {
    const set = this.getSet(setId);
    if (!set || !set.terms || set.terms.length === 0) return '';
    return set.terms.map(t => `${t.term.trim()} - ${t.definition.trim()}`).join('\n');
  }

  // Parser: supports "Term - Definition", Tab-separated, or Comma-separated
  static parseQuizletText(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedTerms = [];

    for (const line of lines) {
      let term = '';
      let definition = '';

      if (line.includes(' - ')) {
        const idx = line.indexOf(' - ');
        term = line.substring(0, idx).trim();
        definition = line.substring(idx + 3).trim();
      } else if (line.includes('\t')) {
        const parts = line.split('\t');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (line.includes(',')) {
        const parts = line.split(',');
        term = parts[0].trim();
        definition = parts.slice(1).join(',').trim();
      }

      if (term && definition) {
        parsedTerms.push({
          id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          term,
          definition,
          starred: false
        });
      }
    }

    return parsedTerms;
  }
}
