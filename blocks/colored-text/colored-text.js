/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [row] = block.children;
  const [, colorCell] = row.children;
  const color = colorCell?.textContent.trim();
  if (color) {
    block.style.color = color;
  }
  colorCell?.remove();
}
