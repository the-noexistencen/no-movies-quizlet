// ==========================================================================
// Theme Management (Catppuccin Latte, Frappé, Macchiato, Mocha & Classic Dark)
// ==========================================================================

export const THEMES = [
  {
    id: 'latte',
    name: 'Catppuccin Latte',
    type: 'light',
    dots: ['#eff1f5', '#1e66f5', '#7287fd', '#40a02b']
  },
  {
    id: 'frappe',
    name: 'Catppuccin Frappé',
    type: 'dark',
    dots: ['#303446', '#8caaee', '#babbf1', '#a6d189']
  },
  {
    id: 'macchiato',
    name: 'Catppuccin Macchiato',
    type: 'dark',
    dots: ['#24273a', '#8aadf4', '#b7bdf8', '#a6da95']
  },
  {
    id: 'mocha',
    name: 'Catppuccin Mocha',
    type: 'dark',
    dots: ['#1e1e2e', '#89b4fa', '#b4befe', '#a6e3a1']
  },
  {
    id: 'classic-dark',
    name: 'Classic Dark',
    type: 'dark',
    dots: ['#0b0f19', '#3b82f6', '#6366f1', '#10b981']
  }
];

const THEME_STORAGE_KEY = 'no_movies_quizlet_theme';

export class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'mocha';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.renderThemeDropdown();
    this.bindEvents();
  }

  applyTheme(themeId) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[3]; // default mocha
    this.currentTheme = theme.id;
    document.documentElement.setAttribute('data-theme', theme.id);
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);

    // Update active label on theme button
    const btnLabel = document.getElementById('currentThemeName');
    if (btnLabel) {
      btnLabel.textContent = theme.name;
    }

    // Update active check in dropdown
    document.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === theme.id);
    });

    // Update header preview dots
    const dotsWrap = document.getElementById('themePreviewDots');
    if (dotsWrap) {
      dotsWrap.innerHTML = theme.dots
        .map(color => `<span class="palette-dot" style="background:${color}"></span>`)
        .join('');
    }
  }

  renderThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    if (!dropdown) return;

    dropdown.innerHTML = THEMES.map(t => `
      <button class="theme-option ${t.id === this.currentTheme ? 'active' : ''}" data-theme="${t.id}">
        <span>${t.name}</span>
        <div class="theme-palette-preview">
          ${t.dots.map(d => `<span class="palette-dot" style="background:${d}"></span>`).join('')}
        </div>
      </button>
    `).join('');
  }

  bindEvents() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const dropdown = document.getElementById('themeDropdown');

    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.theme-option');
        if (option) {
          const themeId = option.dataset.theme;
          this.applyTheme(themeId);
          dropdown.classList.remove('show');
        }
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }
  }
}
