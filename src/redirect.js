const target = document.querySelector('script[data-redirect]')?.dataset.redirect;
if (target) {
  const url = new URL(target, location.origin);
  if (url.origin === location.origin) {
    url.search = location.search;
    url.hash = location.hash;
    location.replace(url.href);
  }
}
