/** Build display name from first + last (used on register and profile updates) */
export function buildDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
