export function repositoryUrl(repository) {
  if (typeof repository !== 'string' || !/^[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+$/.test(repository) ||
      ['.', '..'].includes(repository.split('/')[1])) {
    throw new Error('invalid publication repository: expected owner/name');
  }
  return `https://github.com/${repository}`;
}
