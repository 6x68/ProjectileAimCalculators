// fallback implementation also by CatGPT

const ARROW_GRAVITY = 0.05; // downward acceleration per tick
const FULLY_CHARGED_SPEED = 3.0; // blocks per tick

function isVecFinite(v) {
  return v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * Calculates the normalized direction to hit a moving target.
 *
 * @param {Vector3$1} shooterEyePos     - Shooter's eye position
 * @param {Vector3$1} targetHeadPos     - Current target head position
 * @param {Vector3$1} targetVelocity    - Target velocity (blocks/tick)
 * @param {number} [arrowSpeed=FULLY_CHARGED_SPEED] - Initial speed
 * @returns Normalized direction or null if impossible
 */
function calculateArrowAimDirection(
  shooterEyePos,
  targetHeadPos,
  targetVelocity,
  arrowSpeed = FULLY_CHARGED_SPEED
) {
  // Basic input validation
  if (!isVecFinite(shooterEyePos) || !isVecFinite(targetHeadPos) || !isVecFinite(targetVelocity)) {
    return null;
  }
  if (!Number.isFinite(arrowSpeed) || arrowSpeed <= 0) return null;

  const relPos = targetHeadPos.clone().sub(shooterEyePos);
  const { x, y, z } = relPos;
  const { x: vx, y: vy, z: vz } = targetVelocity;

  // Fallback: Quadratic approximation (no drag, constant gravity)
  const g = ARROW_GRAVITY;
  const v = arrowSpeed;

  // Coefficients for quadratic equation: a*t^2 + b*t + c = 0
  const a = 0.5 * g;
  const b = -(v * vy + 0.5 * g * y);
  const c = v * (x * vx + y * vy + z * vz);

  // guard coefficients
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null;

  const discriminant = b * b - 4 * a * c;
  if (!Number.isFinite(discriminant) || discriminant < 0) {
    return null; // no usable real solution
  }

  // Solve quadratic: t = (-b ± sqrt(b^2 - 4ac)) / (2a)
  const sqrtDisc = Math.sqrt(discriminant);
  const denom = 2 * a;
  if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) return null;

  const t1 = (-b + sqrtDisc) / denom;
  const t2 = (-b - sqrtDisc) / denom;

  // Choose positive time, prefer smaller if both positive
  let t = null;
  if (t1 > 0 && t2 > 0) t = Math.min(t1, t2);
  else if (t1 > 0) t = t1;
  else if (t2 > 0) t = t2;
  else return null;

  // guard t
  if (!Number.isFinite(t) || t <= 0 || t > 1e6) return null;

  // Calculate direction: target position at time t
  const targetX = x + vx * t;
  const targetY = y + vy * t - 0.5 * g * t * t; // Adjust for gravity
  const targetZ = z + vz * t;

  if (![targetX, targetY, targetZ].every(Number.isFinite)) return null;

  // Direction vector
  const dir = new Vector3$1(targetX, targetY, targetZ);
  const len = dir.length();
  if (!Number.isFinite(len) || len < 0.01) return null;

  return dir.normalize();
}