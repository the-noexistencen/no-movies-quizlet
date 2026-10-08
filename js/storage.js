// ==========================================================================
// Storage & Data Layer (LocalStorage CRUD, Starter Decks, Import/Export)
// ==========================================================================

const SETS_STORAGE_KEY = 'no_movies_quizlet_sets_v1';
const HIGH_SCORES_KEY = 'no_movies_quizlet_highscores_v1';

const DEFAULT_STARTER_SETS = [
  {
    id: 'starter-sat-vocab',
    title: 'SAT Vocabulary & High-Frequency Words',
    description: 'Essential high-yield vocabulary words frequently tested on competitive exams.',
    createdAt: Date.now(),
    terms: [
      { id: '1', term: 'Ephemeral', definition: 'Lasting for a very short time; fleeting.', starred: false },
      { id: '2', term: 'Ubiquitous', definition: 'Present, appearing, or found everywhere.', starred: false },
      { id: '3', term: 'Anachronistic', definition: 'Belonging to a period other than that in which it exists.', starred: false },
      { id: '4', term: 'Pernicious', definition: 'Having a harmful effect, especially in a gradual or subtle way.', starred: false },
      { id: '5', term: 'Esoteric', definition: 'Intended for or likely to be understood by only a small number of people.', starred: false },
      { id: '6', term: 'Surreptitious', definition: 'Kept secret, especially because it would not be approved of.', starred: false },
      { id: '7', term: 'Cacophony', definition: 'A harsh, discordant mixture of sounds.', starred: false },
      { id: '8', term: 'Enervate', definition: 'To cause someone to feel drained of energy or vitality; weaken.', starred: false },
      { id: '9', term: 'Fastidious', definition: 'Very attentive to and concerned about accuracy and detail.', starred: false },
      { id: '10', term: 'Gregarious', definition: 'Fond of company; sociable and outgoing.', starred: false },
      { id: '11', term: 'Ineffable', definition: 'Too great or extreme to be expressed or described in words.', starred: false },
      { id: '12', term: 'Mellifluous', definition: 'Sweet or musical; pleasant to hear.', starred: false }
    ]
  },
  {
    id: 'starter-spanish-verbs',
    title: 'Spanish to English Core Verbs',
    description: 'The most commonly used fundamental Spanish verbs for conversational fluency.',
    createdAt: Date.now() - 10000,
    terms: [
      { id: '1', term: 'Hablar', definition: 'To speak / to talk', starred: false },
      { id: '2', term: 'Comer', definition: 'To eat', starred: false },
      { id: '3', term: 'Vivir', definition: 'To live', starred: false },
      { id: '4', term: 'Saber', definition: 'To know (information or facts)', starred: false },
      { id: '5', term: 'Conocer', definition: 'To know (a person or be familiar with a place)', starred: false },
      { id: '6', term: 'Tener', definition: 'To have', starred: false },
      { id: '7', term: 'Poder', definition: 'To be able to / can', starred: false },
      { id: '8', term: 'Querer', definition: 'To want / to love', starred: false },
      { id: '9', term: 'Decir', definition: 'To say / to tell', starred: false },
      { id: '10', term: 'Salir', definition: 'To leave / to go out', starred: false },
      { id: '11', term: 'Llegar', definition: 'To arrive', starred: false },
      { id: '12', term: 'Entender', definition: 'To understand', starred: false }
    ]
  },
  {
    id: 'starter-web-dev',
    title: 'Computer Science & Web Development',
    description: 'Foundational principles of modern software engineering, web architectures, and JavaScript.',
    createdAt: Date.now() - 20000,
    terms: [
      { id: '1', term: 'Closure', definition: 'A function bundled with references to its surrounding lexical environment.', starred: false },
      { id: '2', term: 'Promise', definition: 'An object representing the eventual completion or failure of an asynchronous operation.', starred: false },
      { id: '3', term: 'Idempotent', definition: 'An operation that produces the same result no matter how many times it is applied.', starred: false },
      { id: '4', term: 'DNS', definition: 'System that translates human-readable domain names into IP addresses.', starred: false },
      { id: '5', term: 'Virtual DOM', definition: 'In-memory lightweight representation of the real DOM used to compute efficient UI updates.', starred: false },
      { id: '6', term: 'Event Loop', definition: 'Mechanism that monitors Call Stack and Callback Queue to handle non-blocking asynchronous I/O.', starred: false },
      { id: '7', term: 'Debounce', definition: 'A programming practice used to ensure that time-consuming tasks do not fire so often.', starred: false },
      { id: '8', term: 'JWT (JSON Web Token)', definition: 'A compact, URL-safe means of representing claims securely between two parties.', starred: false },
      { id: '9', term: 'Recursion', definition: 'A problem-solving technique where a function calls itself to solve smaller instances of the problem.', starred: false },
      { id: '10', term: 'Polyfill', definition: 'Code that implements a feature on web browsers that do not support the feature natively.', starred: false },
      { id: '11', term: 'Webhook', definition: 'User-defined HTTP callbacks triggered by specific system events.', starred: false },
      { id: '12', term: 'REST', definition: 'Architectural style for designing networked applications relying on stateless, client-server protocols.', starred: false }
    ]
  }
];

export class StorageService {
  constructor() {
    this.ensureDefaultSets();
  }

  ensureDefaultSets() {
    const existing = localStorage.getItem(SETS_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(DEFAULT_STARTER_SETS));
    }
  }

  getAllSets() {
    try {
      const data = localStorage.getItem(SETS_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_STARTER_SETS;
    } catch (e) {
      console.error('Failed to parse sets from localStorage', e);
      return DEFAULT_STARTER_SETS;
    }
  }

  getSet(id) {
    const sets = this.getAllSets();
    return sets.find(s => s.id === id) || null;
  }

  saveSet(setData) {
    const sets = this.getAllSets();
    const existingIndex = sets.findIndex(s => s.id === setData.id);

    if (existingIndex >= 0) {
      sets[existingIndex] = {
        ...setData,
        updatedAt: Date.now()
      };
    } else {
      sets.unshift({
        ...setData,
        id: setData.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: Date.now()
      });
    }

    localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(sets));
    return setData;
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
        return true; // new record!
      }
      return false;
    } catch {
      return false;
    }
  }

  // Quizlet export parser: parses tab-separated, comma-separated, or semicolon-separated terms
  static parseQuizletText(text, rowDelimiter = '\n', colDelimiter = '\t') {
    if (!text || typeof text !== 'string') return [];
    
    // Auto-detect delimiter if default tab didn't match
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedTerms = [];

    for (const line of lines) {
      let parts = line.split('\t');
      if (parts.length < 2) {
        // Fallback to comma if tab not found
        parts = line.split(',');
      }
      if (parts.length < 2) {
        // Fallback to hyphen or dash
        parts = line.split(' - ');
      }

      if (parts.length >= 2) {
        const term = parts[0].trim();
        const definition = parts.slice(1).join(', ').trim();
        if (term && definition) {
          parsedTerms.push({
            id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            term,
            definition,
            starred: false
          });
        }
      }
    }

    return parsedTerms;
  }

  exportSetAsTSV(setId) {
    const set = this.getSet(setId);
    if (!set) return '';
    return set.terms.map(t => `${t.term}\t${t.definition}`).join('\n');
  }
}
