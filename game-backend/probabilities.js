export function generateColor() {
  const rand = Math.random() * 100;

  if (rand < 45) return "RED";       // 45%
  if (rand < 90) return "GREEN";     // 45%
  return "VIOLET";                   // 10%
}
