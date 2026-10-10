import { SiteFooter } from './vendor/theme/ui/index.mjs';

export function personalFooter(config, year = new Date().getFullYear()) {
  const links = [{ href: config.github, label: 'GitHub', icon: 'github' }];
  if (config.linkedin) links.push({ href: config.linkedin, label: 'LinkedIn', icon: 'linkedin' });
  links.push({ href: '/blog/feed.xml', label: 'RSS', icon: 'rss' });
  return String(SiteFooter({ owner: 'woonyong', year, links }));
}
