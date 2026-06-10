import {
  clampIndex,
  nextIndex,
  prevIndex,
  isFirstIndex,
  isLastIndex,
} from '@/view/IntroSequenceScreen/slideIndex';

describe('slideIndex', () => {
  describe('clampIndex', () => {
    it('keeps an in-range index unchanged', () => {
      expect(clampIndex(2, 5)).toBe(2);
    });
    it('clamps below 0 to 0', () => {
      expect(clampIndex(-3, 5)).toBe(0);
    });
    it('clamps above the last index to the last index', () => {
      expect(clampIndex(9, 5)).toBe(4);
    });
    it('returns 0 when there are no slides', () => {
      expect(clampIndex(3, 0)).toBe(0);
    });
  });

  describe('nextIndex', () => {
    it('advances by one when not at the end', () => {
      expect(nextIndex(0, 3)).toBe(1);
    });
    it('does not advance past the last slide', () => {
      expect(nextIndex(2, 3)).toBe(2);
    });
  });

  describe('prevIndex', () => {
    it('goes back by one when not at the start', () => {
      expect(prevIndex(2, 3)).toBe(1);
    });
    it('does not go below the first slide', () => {
      expect(prevIndex(0, 3)).toBe(0);
    });
  });

  describe('isFirstIndex', () => {
    it('is true at index 0', () => {
      expect(isFirstIndex(0)).toBe(true);
    });
    it('is false past the start', () => {
      expect(isFirstIndex(1)).toBe(false);
    });
  });

  describe('isLastIndex', () => {
    it('is true on the final slide', () => {
      expect(isLastIndex(2, 3)).toBe(true);
    });
    it('is false before the final slide', () => {
      expect(isLastIndex(1, 3)).toBe(false);
    });
    it('treats an empty sequence as the last slide', () => {
      expect(isLastIndex(0, 0)).toBe(true);
    });
  });
});
