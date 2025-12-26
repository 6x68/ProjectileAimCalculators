// fallback implementation also by CatGPT

const ARROW_GRAVITY = 0.05; // downward acceleration per tick
const FULLY_CHARGED_SPEED = 3.0; // blocks per tick

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
    const relPos = targetHeadPos.clone().sub(shooterEyePos);
  const vEnemy = targetVelocity;
  // Fallback: Quadratic approximation (no drag, constant gravity)
    const g = ARROW_GRAVITY;
    const v = arrowSpeed;

    // Relative position and velocity
    const x = relPos.x;
    const y = relPos.y;
    const z = relPos.z;
    const vx = vEnemy.x;
    const vy = vEnemy.y;
    const vz = vEnemy.z;

    // Derive quadratic equation for time t
    // Arrow position at time t: (v*dx*t, v*dy*t - 0.5*g*t^2, v*dz*t)
    // Target position at time t: (x + vx*t, y + vy*t, z + vz*t)
    // Solve for t where they meet: v*dx*t = x + vx*t, etc.
    // For y: v*dy*t - 0.5*g*t^2 = y + vy*t
    // Let u = (dx, dy, dz) be the unit direction vector
    // This leads to a quadratic in t for the y-component

    // Coefficients for quadratic equation: a*t^2 + b*t + c = 0
    const a = 0.5 * g;
    const b = -(v * vy + 0.5 * g * y);
    const c = v * (x * vx + y * vy + z * vz);
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null; // No real solution
    }

    // Solve quadratic: t = (-b ± sqrt(b^2 - 4ac)) / (2a)
    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDisc) / (2 * a);
    const t2 = (-b - sqrtDisc) / (2 * a);

    // Choose positive time, prefer smaller if both positive
    let t = t1 > 0 ? t1 : t2;
    if (t2 > 0 && t2 < t) t = t2;
    if (t <= 0) return null;

    // Calculate direction: target position at time t
    const targetX = x + vx * t;
    const targetY = y + vy * t - 0.5 * g * t * t; // Adjust for gravity
    const targetZ = z + vz * t;

    // Direction vector
    const dir = new Vector3$1(targetX, targetY, targetZ);
    const len = dir.length();
    if (len < 0.01) return null;

    return dir.normalize();
}

export default calculateArrowAimDirection;
