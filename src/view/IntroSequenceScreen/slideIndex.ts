// Pure slide-index math for the intro slideshow. Kept free of React/RN so it is
// trivially unit-testable. `count` is the number of slides (intro articles).

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (index < 0) return 0;
  if (index > count - 1) return count - 1;
  return index;
}

function nextIndex(index: number, count: number): number {
  return clampIndex(index + 1, count);
}

function prevIndex(index: number, count: number): number {
  return clampIndex(index - 1, count);
}

function isFirstIndex(index: number): boolean {
  return index <= 0;
}

function isLastIndex(index: number, count: number): boolean {
  if (count <= 0) return true;
  return index >= count - 1;
}

export { clampIndex, nextIndex, prevIndex, isFirstIndex, isLastIndex };
