export function generateColor() {
  const rand = Math.random() * 100;

  if (rand < 45) return { primary: "RED", secondary: "RED" };
  if (rand < 90) return { primary: "GREEN", secondary: "GREEN" };

  // Violet case - always paired
  const isRed = Math.random() < 0.5;
  return {
    primary: "VIOLET",
    secondary: isRed ? "RED" : "GREEN"
  };
}
