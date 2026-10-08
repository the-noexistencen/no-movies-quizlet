// ==========================================================================
// Theme Management (Catppuccin Latte, Frappé, Macchiato, Mocha & Classic Dark)
// Matches netanyahu-s-final-order Settings theme selector
// ==========================================================================

export const THEME_STORAGE_KEY = 'no_movies_quizlet_theme';

const THEME_META_COLORS = {
  'classic-dark': '#0a0a0a',
  'latte': '#eff1f5',
  'frappe': '#303446',
  'macchiato': '#24273a',
  'mocha': '#1e1e2e'
};

export class ThemeManager {
  constructor(toastFn) {
    this.toast = toastFn || console.log;
    this.currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'classic-dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.bindEvents();
  }

  applyTheme(themeId, notify = true) {
    if (!THEME_META_COLORS[themeId]) {
      themeId = 'classic-dark';
    }

    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);

    // Update meta theme-color for iOS status bar
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme && THEME_META_COLORS[themeId]) {
      metaTheme.setAttribute('content', THEME_META_COLORS[themeId]);
    }

    // Update active state in Settings view
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === themeId);
    });

    if (notify) {
      const formattedName = themeId.charAt(0).toUpperCase() + themeId.slice(1);
      this.toast(`Theme set to ${formattedName}`);
    }
  }

  bindEvents() {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedTheme = card.dataset.theme;
        this.applyTheme(selectedTheme, true);
      });
    });
  }
}
