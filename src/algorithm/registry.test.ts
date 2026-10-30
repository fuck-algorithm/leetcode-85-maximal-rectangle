// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getSolver, ALGORITHM_LIST, generateRandomHeights } from './registry';

describe('solver registry teaching metadata', () => {
  it('provides semantic narration and stable anchors for every frame', () => {
    for (const { id } of ALGORITHM_LIST) {
      const steps = getSolver(id).generateSteps([2, 1, 5, 6, 2, 3]);
      expect(steps.length).toBeGreaterThan(0);
      expect(new Set(steps.map(step => step.id)).size).toBe(steps.length);
      for (const step of steps) {
        expect(step.operation).toBeTruthy();
        expect(step.narration?.trim()).not.toBe('');
        expect(step.anchorIds?.length).toBeGreaterThan(0);
        expect(step.codeLines.java.length).toBeGreaterThan(0);
      }
    }
  });

  it('validates inputs and generates legal random examples', () => {
    for (const { id } of ALGORITHM_LIST) {
      const solver = getSolver(id);
      expect(solver.validateInput('[2,1,5]').valid).toBe(true);
      expect(solver.validateInput('[2,-1]').valid).toBe(false);
      expect(solver.validateInput(`[${generateRandomHeights().join(',')}]`).valid).toBe(true);
    }
  });
});
