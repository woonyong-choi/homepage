// 작성 설정과 홈 원고가 같은 형식 검사를 사용한다. 오류에는 입력 출처와 설정 경로를 붙인다.
export function settingsValidator(prefix = '') {
  const fail = (path, message) => { throw new Error(`${prefix}${path}: ${message}`); };

  function record(value, path, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, '키와 값을 가진 항목이어야 합니다');
    for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, `알 수 없는 설정입니다. 사용할 수 있는 설정: ${keys.join(', ')}`);
    return value;
  }

  function text(value, path, required = true) {
    if (value === undefined || value === null) return required ? fail(path, '값이 필요합니다') : undefined;
    if (typeof value !== 'string') fail(path, '문자열이어야 합니다. 숫자나 날짜처럼 읽히면 따옴표로 감싸세요');
    const trimmed = value.trim();
    if (!trimmed) return required ? fail(path, '비어 있을 수 없습니다') : undefined;
    return trimmed;
  }

  // fallback이 있으면 생략한 값에 사용하고, 없으면 값을 반드시 요구한다.
  function flag(value, path, fallback) {
    if (value === undefined && fallback !== undefined) return fallback;
    if (typeof value !== 'boolean') fail(path, 'true 또는 false여야 합니다');
    return value;
  }

  return { fail, record, text, flag };
}
