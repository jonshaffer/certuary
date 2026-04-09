export interface MdsPoint {
  index: number;
  x: number;
  y: number;
}

/**
 * Classical (metric) Multidimensional Scaling via Torgerson's method.
 * Takes an NxN symmetric distance matrix and returns 2D coordinates
 * that best preserve pairwise distances.
 */
export function classicalMds(distances: number[][]): MdsPoint[] {
  const n = distances.length;
  if (n === 0) return [];
  if (n === 1) return [{ index: 0, x: 0, y: 0 }];

  // 1. Square the distances
  const d2: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => distances[i][j] ** 2)
  );

  // 2. Double-center to get the Gram matrix B
  // B[i][j] = -0.5 * (D²[i][j] - rowMean[i] - colMean[j] + grandMean)
  const rowMeans = new Array<number>(n);
  const colMeans = new Array<number>(n);
  let grandMean = 0;

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += d2[i][j];
    rowMeans[i] = sum / n;
    grandMean += sum;
  }
  grandMean /= n * n;

  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += d2[i][j];
    colMeans[j] = sum / n;
  }

  const b: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from(
      { length: n },
      (_, j) => -0.5 * (d2[i][j] - rowMeans[i] - colMeans[j] + grandMean)
    )
  );

  // 3. Extract top 2 eigenvectors via power iteration with deflation
  const eigenvectors: number[][] = [];
  const eigenvalues: number[] = [];
  const bWork = b.map((row) => [...row]);

  for (let k = 0; k < 2; k++) {
    const { value, vector } = powerIteration(bWork, n);
    eigenvalues.push(value);
    eigenvectors.push(vector);

    // Deflate: B = B - λ * v * vᵀ
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        bWork[i][j] -= value * vector[i] * vector[j];
      }
    }
  }

  // 4. Compute coordinates: coord[i] = sqrt(max(0, λ)) * v[i]
  const points: MdsPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.sqrt(Math.max(0, eigenvalues[0])) * eigenvectors[0][i];
    const y = Math.sqrt(Math.max(0, eigenvalues[1])) * eigenvectors[1][i];
    points.push({ index: i, x, y });
  }

  // Apply canonical sign convention for determinism:
  // ensure the component with largest absolute value is positive
  for (let dim = 0; dim < 2; dim++) {
    const values = points.map((p) => (dim === 0 ? p.x : p.y));
    let maxAbs = 0;
    let maxVal = 0;
    for (const v of values) {
      if (Math.abs(v) > maxAbs) {
        maxAbs = Math.abs(v);
        maxVal = v;
      }
    }
    if (maxVal < 0) {
      for (const p of points) {
        if (dim === 0) p.x = -p.x;
        else p.y = -p.y;
      }
    }
  }

  return points;
}

const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-8;

function powerIteration(
  matrix: number[][],
  n: number
): { value: number; vector: number[] } {
  // Initialize with a deterministic non-zero vector
  let v = Array.from({ length: n }, (_, i) => (i + 1) / n);
  let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  v = v.map((x) => x / norm);

  let eigenvalue = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Multiply: w = M * v
    const w = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        w[i] += matrix[i][j] * v[j];
      }
    }

    // Compute eigenvalue (Rayleigh quotient)
    const newEigenvalue = w.reduce((s, x, i) => s + x * v[i], 0);

    // Normalize
    norm = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
    if (norm < TOLERANCE) {
      return { value: 0, vector: v };
    }
    const vNew = w.map((x) => x / norm);

    // Check convergence
    if (Math.abs(newEigenvalue - eigenvalue) < TOLERANCE) {
      return { value: newEigenvalue, vector: vNew };
    }

    eigenvalue = newEigenvalue;
    v = vNew;
  }

  return { value: eigenvalue, vector: v };
}
