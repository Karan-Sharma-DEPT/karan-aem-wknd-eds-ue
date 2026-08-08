/**
 * loads and decorates the heading-intro block
 *
 * expected content: two rows, one cell each
 *   row 1 - the display heading, always a heading element (title + titleType)
 *   row 2 - the supporting intro copy
 * both rows are optional; rows are identified by their content rather than
 * their position so an author can supply either one on its own.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // an author can set the heading level without typing a heading, which leaves
  // an empty element behind; drop those so they take up no space
  const rows = [...block.children].filter((row) => {
    if (row.textContent.trim()) return true;
    row.remove();
    return false;
  });

  // inner wrapper keeps the content grid at its design width while the block
  // itself spans the section so the vertical grid rules land in the gutters
  const content = document.createElement('div');
  content.className = 'heading-intro-content';
  content.append(...rows);
  block.append(content);

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const isHeading = !!cell.querySelector('h1, h2, h3, h4, h5, h6');
    row.className = isHeading ? 'heading-intro-heading' : 'heading-intro-body';

    // unwrap the single cell so the row itself carries the content
    if (row.firstElementChild === cell && row.children.length === 1) {
      row.replaceChildren(...cell.childNodes);
    }

    // the four "+" grid marks that frame the intro copy
    if (!isHeading) {
      ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
        const mark = document.createElement('span');
        mark.className = `heading-intro-mark heading-intro-mark-${corner}`;
        mark.setAttribute('aria-hidden', 'true');
        row.append(mark);
      });
    }
  });
}
