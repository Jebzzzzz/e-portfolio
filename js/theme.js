const themeToggle = document.querySelector('.theme-toggle');
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

const getTheme = () => document.documentElement.dataset.theme || 'light';

const updateThemeControl = (theme) => {
  if (!themeToggle) return;

  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.title = `Switch to ${nextTheme} mode`;
};

const applyTheme = (theme, persist = true) => {
  document.documentElement.dataset.theme = theme;
  updateThemeControl(theme);

  if (!persist) return;

  try {
    localStorage.setItem('portfolio-theme', theme);
  } catch {
    // The selected theme still applies when storage is unavailable.
  }
};

updateThemeControl(getTheme());

themeToggle?.addEventListener('click', async () => {
  const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
  const bounds = themeToggle.getBoundingClientRect();
  const originX = bounds.left + bounds.width / 2;
  const originY = bounds.top + bounds.height / 2;
  const radius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reducedMotion) {
    applyTheme(nextTheme);
    return;
  }

  themeToggle.disabled = true;
  document.documentElement.style.setProperty('--theme-transition-x', `${originX}px`);
  document.documentElement.style.setProperty('--theme-transition-y', `${originY}px`);
  document.documentElement.classList.add('theme-transitioning');

  try {
    const transition = document.startViewTransition(() => applyTheme(nextTheme));
    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${radius}px at ${originX}px ${originY}px)`
        ]
      },
      {
        duration: 680,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'both',
        pseudoElement: '::view-transition-new(root)'
      }
    );

    await transition.finished;
  } catch {
    applyTheme(nextTheme);
  } finally {
    document.documentElement.classList.remove('theme-transitioning');
    document.documentElement.style.removeProperty('--theme-transition-x');
    document.documentElement.style.removeProperty('--theme-transition-y');
    themeToggle.disabled = false;
  }
});

colorSchemeQuery.addEventListener('change', (event) => {
  try {
    if (localStorage.getItem('portfolio-theme')) return;
  } catch {
    // Follow the system theme when storage cannot be read.
  }

  applyTheme(event.matches ? 'dark' : 'light', false);
});
