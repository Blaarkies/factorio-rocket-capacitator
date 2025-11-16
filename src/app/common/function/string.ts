type TextFormat =
  | 'title case'
  | 'sentence case'
  ;
export function camelCaseTo(it: string, format: TextFormat = 'title case'): string {

  let words = [];
  let buffer = '';
  for (const char of it.split('')) {
    if ((char.charCodeAt(0) & 0b0100000) >> 5) {
      // is lowercase (2nd bit of char's ascii value flags it as lowercase)
      buffer += char;
      continue;
    }

    // is uppercase
    words.push(buffer);
    buffer = char.toLocaleLowerCase();
  }

  if (buffer.length) {
    words.push(buffer);
  }

  switch (format) {
    case 'title case':
      return words.map(w => w[0].toLocaleUpperCase()
        + w.slice(1))
        .join(' ');
    case 'sentence case':
      return [words[0][0].toLocaleUpperCase() + words[0].slice(1)]
        .concat(words.slice(1))
        .join(' ');
    default:
      throw new Error(`Cannot format text to unknown format [${format}]`);
  }
}
