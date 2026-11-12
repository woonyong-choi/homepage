const BACKSLASH = String.fromCharCode(92);

function findClosingMarker(src, from, marker) {
  let end = from;
  while ((end = src.indexOf(marker, end)) !== -1) {
    let escapes = 0;
    for (let at = end - 1; at >= 0 && src[at] === BACKSLASH; at -= 1) escapes += 1;
    if (escapes % 2 === 0) return end;
    end += marker.length;
  }
  return -1;
}

export function findMarkEnd(src, start, marker) {
  const first = src[start + marker.length] ?? ' ';
  if (
    src.slice(start, start + marker.length) !== marker ||
    /\s/.test(first) ||
    first === marker[0]
  ) {
    return -1;
  }
  const end = findClosingMarker(src, start + marker.length, marker);
  if (end < 0 || /\s/.test(src[end - 1]) || src.slice(start + marker.length, end).includes('\n')) {
    return -1;
  }
  return end;
}
