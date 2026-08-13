import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Returns the first cell of a block row, or null when the row is absent.
 * @param {Element} row The block row
 * @returns {Element|null} The cell holding the authored value
 */
function cellOf(row) {
  return row ? row.firstElementChild || row : null;
}

/**
 * True when a cell holds no authored content.
 * @param {Element} cell The cell to inspect
 * @returns {boolean} whether the cell is empty
 */
function isEmpty(cell) {
  return !cell || (!cell.textContent.trim() && !cell.querySelector('picture, img'));
}

/**
 * Pauses the background animation while the hero is off screen, so the
 * decorative grid never burns cycles the reader cannot see.
 * @param {Element} block The hero block
 */
function observeAnimation(block) {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting }) => {
      block.classList.toggle('hero-centered-paused', !isIntersecting);
    });
  }, { threshold: 0 });
  observer.observe(block);
}

/**
 * Builds the decorative background: the authored texture, a scrim to keep the
 * copy legible, the static grid, and the cyan pulse layer.
 * @param {Element} imageCell The cell holding the authored background image
 * @returns {Element} The background element
 */
function buildBackground(imageCell) {
  const background = document.createElement('div');
  background.className = 'hero-centered-background';
  background.setAttribute('aria-hidden', 'true');

  const picture = imageCell && imageCell.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      img.setAttribute('alt', '');
      // Decorative, but above the fold — do not lazy load it.
      img.setAttribute('loading', 'eager');
    }
    background.append(picture);

    // Wash the texture back so the dark copy keeps its contrast.
    const scrim = document.createElement('div');
    scrim.className = 'hero-centered-scrim';
    background.append(scrim);
  }

  const grid = document.createElement('div');
  grid.className = 'hero-centered-grid';
  const glow = document.createElement('div');
  glow.className = 'hero-centered-glow';
  background.append(grid, glow);

  return background;
}

/**
 * Collects the authored Button children into a single actions row.
 * Buttons are already classed by decorateButtons: `primary` for bold links,
 * `secondary` for italic ones. Anything unstyled falls back to primary.
 * @param {Element[]} rows The block rows holding button children
 * @returns {Element|null} The actions element, or null when nothing is authored
 */
function buildActions(rows) {
  const actions = document.createElement('div');
  actions.className = 'hero-centered-actions';

  rows.forEach((row) => {
    const link = row.querySelector('a[href]');
    if (!link || !link.textContent.trim()) return;

    const variant = link.classList.contains('secondary') ? 'secondary' : 'primary';
    link.className = `hero-centered-cta hero-centered-cta-${variant}`;
    link.title = link.title || link.textContent.trim();

    // The arrow is decorative — screen readers announce the label only.
    const arrow = document.createElement('span');
    arrow.className = 'hero-centered-cta-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    link.append(arrow);

    moveInstrumentation(row, link);
    actions.append(link);
  });

  return actions.children.length ? actions : null;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const [imageRow, badgeRow, contentRow, mediaRow] = rows;

  const background = buildBackground(cellOf(imageRow));

  const text = document.createElement('div');
  text.className = 'hero-centered-text';

  // Cells are moved rather than cloned so Universal Editor instrumentation
  // stays attached to the element the author edits.
  const badgeCell = cellOf(badgeRow);
  if (!isEmpty(badgeCell)) {
    badgeCell.classList.add('hero-centered-badge');
    text.append(badgeCell);
  }

  const contentCell = cellOf(contentRow);
  if (!isEmpty(contentCell)) {
    contentCell.classList.add('hero-centered-copy');
    // Authors format the first line as Heading 1; promote anything else so the
    // hero always exposes exactly one top-level heading.
    const heading = contentCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.tagName !== 'H1') {
      const h1 = document.createElement('h1');
      h1.innerHTML = heading.innerHTML;
      moveInstrumentation(heading, h1);
      heading.replaceWith(h1);
    }
    text.append(contentCell);
  }

  const stack = document.createElement('div');
  stack.className = 'hero-centered-stack';
  stack.append(text);

  const actions = buildActions(rows.slice(4));
  if (actions) stack.append(actions);

  const content = document.createElement('div');
  content.className = 'hero-centered-content';
  content.append(stack);

  const mediaCell = cellOf(mediaRow);
  if (mediaCell && mediaCell.querySelector('picture')) {
    mediaCell.classList.add('hero-centered-media');
    content.append(mediaCell);
  }

  block.textContent = '';
  block.append(background, content);

  observeAnimation(block);
}
