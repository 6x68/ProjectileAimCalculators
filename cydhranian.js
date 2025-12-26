// https://gitlab.com/Cydhra/Vibrant/-/blob/master/doc/main.pdf
// I put that paper into CatGPT because I can't be asked AND also fed it Miniblox source code

const ARROW_DRAG = 0.99;     // air resistance factor
const ARROW_GRAVITY = 0.05;  // downward acceleration per tick
const FULLY_CHARGED_SPEED = 3.0; // blocks per tick

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
  const relPos = targetHeadPos.clone().sub(shooterEyePos);
  const vEnemy = targetVelocity;

  const r = ARROW_DRAG;
  const g = ARROW_GRAVITY;

  const r_minus_1 = r - 1;
  const inv_r_minus_1 = 1 / r_minus_1;

  function directionAtT(t) {
    if (t <= 0) return new Vector3$1();

    const rt = Math.pow(r, t);
    const rt_minus_1 = rt - 1;

    const horizFactor = r_minus_1 / (arrowSpeed * rt_minus_1);

    const gravTerm =
      g *
      (rt - r * t + t - 1) *
      inv_r_minus_1 /
      (arrowSpeed * rt_minus_1);

    const dx = (relPos.x + vEnemy.x * t) * horizFactor;
    const dy = (relPos.y + vEnemy.y * t) * horizFactor + gravTerm;
    const dz = (relPos.z + vEnemy.z * t) * horizFactor;

    return new Vector3$1(dx, dy, dz);
  }

  function magnitudeAtT(t) {
    return directionAtT(t).length();
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

      if (Math.abs(mag - 1.0) < EPS) {
        const dir = directionAtT(mid);
        return dir.normalize();
      }

      if (mag > 1.0) {
        if (magnitudeAtT(low) < mag) high = mid;
        else low = mid;
      } else {
        if (magnitudeAtT(high) > mag) low = mid;
        else high = mid;
      }
    }

    // Fallback to best integer
    const dir = directionAtT(bestT);
    const len = dir.length();
    if (len > 0.01) return dir.normalize();
  }

  return null;
}

// using eval(await fetch("...")) instead of import now
return calculateArrowAimDirection;
