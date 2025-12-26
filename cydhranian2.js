// https://gitlab.com/Cydhra/Vibrant/-/blob/master/doc/main.pdf
// I put that paper into CatGPT because I can't be asked AND also fed it Miniblox source code

const ARROW_DRAG = 0.99;     // air resistance factor
const ARROW_GRAVITY = 0.05;  // downward acceleration per tick
const FULLY_CHARGED_SPEED = 3.0; // blocks per tick

function isVecFinite(v) {
  return v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * Calculates the normalized direction to hit a moving target.
 *
 * @param {Vector3} shooterEyePos     - Shooter's eye position
 * @param {Vector3} targetHeadPos     - Current target head position
 * @param {Vector3} targetVelocity    - Target velocity (blocks/tick)
 * @param {number} [arrowSpeed=FULLY_CHARGED_SPEED] - Initial speed
 * @returns {Vector3|null} Normalized direction or null if impossible
 */
function calculateArrowAimDirection(
  shooterEyePos,
  targetHeadPos,
  targetVelocity,
  arrowSpeed = FULLY_CHARGED_SPEED
) {
  // Basic validation
  if (!isVecFinite(shooterEyePos) || !isVecFinite(targetHeadPos) || !isVecFinite(targetVelocity)) return null;
  if (!Number.isFinite(arrowSpeed) || arrowSpeed <= 0) return null;

  const relPos = targetHeadPos.clone().sub(shooterEyePos);
  const { x: relX, y: relY, z: relZ } = relPos;
  const { x: vX, y: vY, z: vZ } = targetVelocity;

  const r = ARROW_DRAG;
  const g = ARROW_GRAVITY;

  const r_minus_1 = r - 1;
  if (!Number.isFinite(r_minus_1) || Math.abs(r_minus_1) < 1e-12) return null;
  const inv_r_minus_1 = 1 / r_minus_1;

  function directionAtT(t) {
    if (!Number.isFinite(t) || t <= 0) return new Vector3$1();

    const rt = Math.pow(r, t);
    if (!Number.isFinite(rt)) return new Vector3$1();

    const rt_minus_1 = rt - 1;
    // avoid dividing by a tiny number (rt ≈ 1 -> huge factors)
    if (!Number.isFinite(rt_minus_1) || Math.abs(rt_minus_1) < 1e-12) return new Vector3$1();

    const horizFactor = r_minus_1 / (arrowSpeed * rt_minus_1);

    const gravTerm =
      g *
      (rt - r * t + t - 1) *
      inv_r_minus_1 /
      (arrowSpeed * rt_minus_1);

    const dx = (relX + vX * t) * horizFactor;
    const dy = (relY + vY * t) * horizFactor + gravTerm;
    const dz = (relZ + vZ * t) * horizFactor;

    const vec = new Vector3$1(dx, dy, dz);
    // guard against non-finite components
    if (![vec.x, vec.y, vec.z].every(Number.isFinite)) return new Vector3$1();
    return vec;
  }

  function magnitudeAtT(t) {
    const dir = directionAtT(t);
    return dir.length();
  }

  const MAX_T = 300; // ~15 seconds max flight time
  const EPS = 0.001;
  let bestT = null;
  let bestDiff = Infinity;

  // Brute-force integer ticks
  for (let t = 1; t <= MAX_T; t++) {
    const mag = magnitudeAtT(t);
    const diff = Math.abs(mag - 1.0);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestT = t;
    }

    if (diff < EPS) {
      const dir = directionAtT(t);
      if (![dir.x, dir.y, dir.z].every(Number.isFinite)) return null;
      const len = dir.length();
      if (!Number.isFinite(len) || len < 0.01) return null;
      return dir.normalize();
    }
  }

  // Refine with bisection around best integer
  if (bestT !== null && bestDiff > EPS) {
    let low = Math.max(1, bestT - 20);
    let high = Math.min(MAX_T, bestT + 20);

    for (let i = 0; i < 70; i++) {
      const mid = (low + high) * 0.5;
      const mag = magnitudeAtT(mid);

      if (!Number.isFinite(mag)) break;

      if (Math.abs(mag - 1.0) < EPS) {
        const dir = directionAtT(mid);
        if (![dir.x, dir.y, dir.z].every(Number.isFinite)) return null;
        const len = dir.length();
        if (!Number.isFinite(len) || len < 0.01) return null;
        return dir.normalize();
      }

      // safe comparisons using finite magnitudes at bounds
      const magLow = magnitudeAtT(low);
      const magHigh = magnitudeAtT(high);
      if (!Number.isFinite(magLow) || !Number.isFinite(magHigh)) break;

      if (mag > 1.0) {
        if (magLow < mag) high = mid;
        else low = mid;
      } else {
        if (magHigh > mag) low = mid;
        else high = mid;
      }
    }

    // Fallback to best integer
    const dir = directionAtT(bestT);
    const len = dir.length();
    if (!Number.isFinite(len) || len < 0.01) return null;
    return dir.normalize();
  }

  return null;
}