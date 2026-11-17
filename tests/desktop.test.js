const {test} = require('node:test');
const assert = require('node:assert/strict');
const {toWindowsPath, protocolLink, install} = require('../stash-desktop.js');

test('maps paths with spaces and Unicode without including server-specific defaults', () => {
  assert.equal(toWindowsPath('/media/例/clip one.mp4', '/media/', 'D:\\Videos'), 'D:\\Videos\\例\\clip one.mp4');
  assert.equal(toWindowsPath('/media/clip.mkv', '/media', '\\\\server\\share'), '\\\\server\\share\\clip.mkv');
  const path = 'D:\\Videos\\例\\clip one.mp4';
  const payload = protocolLink(path).split('/open/')[1];
  assert.equal(Buffer.from(payload, 'base64url').toString('utf8'), path);
});

test('rejects paths outside the mapping, traversal and Windows metacharacters', () => {
  for (const path of ['/media-other/clip.mkv','/media/../outside.mkv','/media/sub/../../file.mkv','/media/a".mkv','/media/a:stream','/media/']) {
    assert.throws(() => toWindowsPath(path, '/media', 'D:\\Videos'));
  }
  for (const root of ['relative','D:relative','D:\\Videos\\..','D:\\V"ideos']) assert.throws(() => toWindowsPath('/media/clip.mkv', '/media', root));
  assert.throws(() => toWindowsPath('/media/clip.mkv', '', ''), /Configure both/);
});

function fakeWindow({files = [{path:'/media/test clip.mkv'}], settings = {server_path_prefix:'/media',windows_path_prefix:'D:\\Videos'}, prefix = ''} = {}) {
  const created = [];
  function element() {return {children:[], setAttribute(){}, appendChild(child){this.children.push(child);}, contains(child){return this.children.includes(child);}, insertBefore(child){this.children.push(child);}, lastElementChild:{}};}
  const toolbar = element(); toolbar.querySelectorAll = () => [];
  const window = {
    location:{pathname:prefix+'/scenes/42',href:''},
    document:{body:{}, createElement(){const node=element();created.push(node);return node;},querySelector(){return toolbar;}},
    MutationObserver: class {observe(){}},addEventListener(){},console:{warn(){}},
    alerts:[],alert(message){this.alerts.push(message);},prompt(){return '1';},requests:[],
    async fetch(url, options){const body=JSON.parse(options.body);this.requests.push({url,body});return {ok:true, async json(){return {data:body.query.includes('Settings')?{configuration:{plugins:{StashDesktop:settings}}}:{findScene:{files}}};}};}
  };
  return {window, created, toolbar};
}

test('adds one toolbar icon, reads current settings and opens the selected scene file', async () => {
  const {window, toolbar}=fakeWindow({prefix:'/stash'});
  const first=install(window);assert.equal(toolbar.children.length,1);
  assert.equal(install(window),undefined);assert.equal(toolbar.children.length,1);
  first.update();assert.equal(toolbar.children.length,1);
  await first.button.onclick();
  assert.equal(window.alerts.length,0);
  assert.equal(window.requests.length,2);
  assert.ok(window.requests.every(request=>request.url==='/stash/graphql'));
  assert.equal(window.requests[1].body.variables.id,'42');
  assert.equal(Buffer.from(window.location.href.split('/open/')[1],'base64url').toString('utf8'),'D:\\Videos\\test clip.mkv');
  assert.equal(first.button.disabled,false);
});

test('shows configuration errors instead of using a hidden personal mapping', async () => {
  const {window}=fakeWindow({settings:{}});const ui=install(window);await ui.button.onclick();
  assert.equal(window.location.href,'');assert.match(window.alerts[0],/Configure both path prefixes/);
});

test('handles multiple files, cancellation and leaving the scene route', async () => {
  const {window}=fakeWindow({files:[{path:'/media/one.mkv'},{path:'/media/two.mkv'}]});
  window.prompt=()=> '2';const ui=install(window);await ui.button.onclick();
  assert.equal(Buffer.from(window.location.href.split('/open/')[1],'base64url').toString('utf8'),'D:\\Videos\\two.mkv');
  window.location.href='';window.prompt=()=>null;await ui.button.onclick();assert.equal(window.location.href,'');
  window.location.pathname='/performers';ui.update();assert.equal(ui.button.hidden,true);
});

test('does not add a second icon when the old explorer plugin is still active', () => {
  const {window,toolbar}=fakeWindow();window.__stashExplorerLoaded=true;
  assert.equal(install(window),undefined);assert.equal(toolbar.children.length,0);
});
