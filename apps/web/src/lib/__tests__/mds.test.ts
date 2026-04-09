import { describe, it, expect } from "vitest";
import { classicalMds } from "../mds";

describe("classicalMds", () => {
  it("returns empty array for empty input", () => {
    expect(classicalMds([])).toEqual([]);
  });

  it("returns single point at origin for 1 item", () => {
    const result = classicalMds([[0]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ index: 0, x: 0, y: 0 });
  });

  it("returns 2 points with correct separation for 2 items", () => {
    const dist = 1;
    const result = classicalMds([
      [0, dist],
      [dist, 0],
    ]);
    expect(result).toHaveLength(2);
    const dx = result[1].x - result[0].x;
    const dy = result[1].y - result[0].y;
    const actualDist = Math.sqrt(dx * dx + dy * dy);
    expect(actualDist).toBeCloseTo(dist, 3);
  });

  it("preserves distance ordering (closer items stay closer)", () => {
    // A is close to B (0.2), far from C (0.9); B is medium from C (0.6)
    const distances = [
      [0, 0.2, 0.9],
      [0.2, 0, 0.6],
      [0.9, 0.6, 0],
    ];
    const result = classicalMds(distances);
    expect(result).toHaveLength(3);

    function dist(i: number, j: number) {
      const dx = result[j].x - result[i].x;
      const dy = result[j].y - result[i].y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // A-B should be closer than A-C
    expect(dist(0, 1)).toBeLessThan(dist(0, 2));
    // B-C should be closer than A-C
    expect(dist(1, 2)).toBeLessThan(dist(0, 2));
  });

  it("places identical items at the same point", () => {
    const distances = [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 0],
    ];
    const result = classicalMds(distances);
    expect(result[0].x).toBeCloseTo(result[1].x, 5);
    expect(result[0].y).toBeCloseTo(result[1].y, 5);
  });

  it("is deterministic across calls", () => {
    const distances = [
      [0, 0.3, 0.7],
      [0.3, 0, 0.5],
      [0.7, 0.5, 0],
    ];
    const r1 = classicalMds(distances);
    const r2 = classicalMds(distances);
    for (let i = 0; i < r1.length; i++) {
      expect(r1[i].x).toEqual(r2[i].x);
      expect(r1[i].y).toEqual(r2[i].y);
    }
  });
});
