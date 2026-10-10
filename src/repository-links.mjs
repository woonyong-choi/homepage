// 설정의 저장소 식별자를 검증해 GitHub 링크의 공통 기준으로 사용한다.
export function repositoryUrl(repository) {
  if (typeof repository !== 'string' || !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+$/.test(repository) ||
      ['.', '..'].includes(repository.split('/')[1])) {
    throw new Error('invalid publication repository: expected owner/name');
  }
  return `https://github.com/${repository}`;
}
