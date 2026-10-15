import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contentIcon } from './content-icons.mjs';
import { renderArticle } from './article-renderer.mjs';

test('small_icons_omit_article_badges_and_invalid_names_fail',()=>{
  assert.notEqual(contentIcon({name:'database',kind:'concept'}),contentIcon('database'));
  assert.equal(contentIcon({name:'database',kind:'concept'},'small'),contentIcon('database','small'));
  assert.throws(()=>contentIcon('absent'));
  assert.throws(()=>contentIcon({name:'database',kind:'absent'}));
});

test('markdown_cards_accept_content_icons',async()=>{
  const {html}=await renderArticle({id:'cards',description:'',body:'```ui:cards\n'+JSON.stringify({items:[{title:'트랜잭션',href:'/docs/',icon:{name:'database',kind:'concept'}}]})+'\n```'});
  assert.match(html,/<svg/);
  assert.match(html,/aria-hidden="true"/);
});
