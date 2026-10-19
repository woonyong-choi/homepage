import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contentIcon } from './content-icons.mjs';
import { renderArticle } from './article-renderer.mjs';

test('small_icons_use_registered_artwork_without_badges_and_unknown_names_fail', () => {
  assert.notEqual(contentIcon('document'), contentIcon('document', 'small'));
  assert.doesNotMatch(contentIcon('document', 'small'), /app-content-icon-badge/);
  assert.throws(() => contentIcon('absent'), /unknown icon/);
  assert.match(contentIcon('database'), /<svg/);
  assert.match(contentIcon('processor'), /<svg/);
  assert.throws(() => contentIcon({ name: 'document', kind: 'concept' }), /unknown icon kind/);
});

test('markdown_cards_accept_content_icons',async()=>{
  const {html}=await renderArticle({id:'cards',description:'',body:'```ui:cards\n'+JSON.stringify({items:[{title:'트랜잭션',href:'/docs/',icon:{name:'document'}}]})+'\n```'});
  assert.match(html,/<svg/);
  assert.match(html,/aria-hidden="true"/);
});
