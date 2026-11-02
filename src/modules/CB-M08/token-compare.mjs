// Constant-time compare for the scheduler token: a wrong value never leaks its
// shared prefix through timing.

export function sameToken(presented, expected) {
  const left = String(presented ?? '');
  const right = String(expected ?? '');
  if (left.length !== right.length || right.length === 0) return false;
  let difference = 0;
  for (let index = 0; index < right.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
