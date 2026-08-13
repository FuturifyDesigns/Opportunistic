/** Internal storage markers that must never appear in the UI. */
export function stripInternalMarkup(text = '') {
  return String(text ?? '')
    .replace(/\[\[opp_[\w/-]+\]\][\s\S]*?\[\[\/opp_[\w/-]+\]\]/gi, ' ')
    .replace(/\[\[\/?opp_[\w/-]+\]\]/gi, ' ')
    .replace(/\[opp_[^\]]+\]/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
