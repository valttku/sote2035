/**
 * Detect emergency risk in user message
 */
export function checkEmergencyRisk(message: string): boolean {
  // Emergency dangerous keywords list
  const dangerKeywords = [
    "chest pain",
    "heart attack",
    "stroke",
    "unconscious",
    "severe bleeding",
    "suicide",
    "shortness of breath"
  ];

  // Check if message contains danger keywords
  return dangerKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
}