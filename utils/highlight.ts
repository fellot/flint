export function highlightSearchTerm(text: string, searchTerm: string): (string | { text: string; highlighted: boolean })[] {
  if (!searchTerm.trim()) {
    return [{ text, highlighted: false }];
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return { text: part, highlighted: true };
    }
    return { text: part, highlighted: false };
  });
}
