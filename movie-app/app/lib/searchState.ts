// Simple in-memory search state to avoid using local route params
let lastSearch = '';

export function setLastSearch(q: string) {
  lastSearch = q ?? '';
}

export function getLastSearch() {
  return lastSearch;
}

export default { setLastSearch, getLastSearch };
