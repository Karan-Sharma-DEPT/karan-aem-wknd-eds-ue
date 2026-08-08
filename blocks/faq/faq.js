import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

/**
 * picks the heading level to use for each question, one step below the block
 * heading so the section keeps a valid outline
 * @param {Element} heading The block heading, if the author supplied one
 * @returns {string} a tag name between h3 and h6
 */
function questionLevel(heading) {
  const blockLevel = heading ? Number(heading.tagName[1]) : 2;
  return `h${Math.min(blockLevel + 1, 6)}`;
}

/**
 * moves the content of an authored cell into an element we have built.
 *
 * decorateBlock wraps a cell of inline text in a <p> before the block loads,
 * which would nest illegally inside the <p> or heading built here, so that
 * wrapper is unwrapped and its instrumentation carried over so the field stays
 * editable in Universal Editor.
 *
 * @param {Element} target The element to fill
 * @param {Element} cell The authored cell
 * @returns {Element} the target
 */
function fillFrom(target, cell) {
  const [only] = cell.children;
  const source = cell.childNodes.length === 1 && only && only.tagName === 'P' ? only : cell;
  moveInstrumentation(source, target);
  target.append(...source.childNodes);
  return target;
}

/**
 * builds one accordion panel from an authored row
 * @param {Element} row The row, whose first cell is the question
 * @param {string} level The tag name to wrap the question in
 * @returns {Element} a details element, or a plain div when there is no answer
 */
function buildItem(row, level) {
  const [questionCell, answerCell] = row.children;
  const hasAnswer = answerCell && answerCell.textContent.trim();

  // without an answer there is nothing to disclose, so the question renders as
  // a plain row rather than a control that expands onto empty space
  const item = document.createElement(hasAnswer ? 'details' : 'div');
  item.className = 'faq-item';
  moveInstrumentation(row, item);

  const question = document.createElement(hasAnswer ? 'summary' : 'div');
  question.className = 'faq-question';

  question.append(fillFrom(document.createElement(level), questionCell));

  if (hasAnswer) {
    // the +/- mark is decorative; the state is already announced by <summary>
    const icon = document.createElement('span');
    icon.className = 'faq-icon';
    icon.setAttribute('aria-hidden', 'true');
    question.append(icon);
  }

  item.append(question);

  if (hasAnswer) {
    answerCell.className = 'faq-answer';
    item.append(answerCell);
  }

  return item;
}

/**
 * loads and decorates the faq block
 *
 * expected content:
 *   a row with a single cell of plain text        - the eyebrow label
 *   a row with a single cell holding h1-h6        - the block heading
 *   any number of rows with two cells             - question, answer
 * every part is optional, and rows are identified by their shape rather than
 * their position so an author can leave any of them out.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const intro = document.createElement('div');
  intro.className = 'faq-intro';
  const list = document.createElement('div');
  list.className = 'faq-list';

  let heading = null;
  const itemRows = [];

  [...block.children].forEach((row) => {
    // an author can set a heading level or add an item without typing anything,
    // which leaves an empty row behind; drop those so they take up no space
    if (!row.textContent.trim()) return;

    if (row.children.length > 1) {
      itemRows.push(row);
      return;
    }

    const cell = row.firstElementChild || row;
    const authored = cell.querySelector(HEADING_SELECTOR);
    if (authored) {
      heading = authored;
      intro.append(authored);
    } else {
      const eyebrow = fillFrom(document.createElement('p'), cell);
      eyebrow.className = 'faq-eyebrow';
      intro.prepend(eyebrow);
    }
  });

  const level = questionLevel(heading);
  itemRows.forEach((row) => list.append(buildItem(row, level)));

  block.replaceChildren(...[intro, list].filter((part) => part.childElementCount));
}
