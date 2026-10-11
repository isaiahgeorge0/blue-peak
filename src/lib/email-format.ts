/*
  A light check for typed email addresses: something before an @, and a
  domain with a dot after it, with no spaces. It catches the usual slips
  (no @, no domain, a missing dot) and lets anything unusual but valid
  through, such as plus addressing, long new domains and non-English letters.
*/

export const EMAIL_FORMAT_MESSAGE = "That email doesn't look quite right.";

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@.][^\s@]*$/.test(value.trim()) && !/\.\./.test(value);
}
