(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.install(root);
})(globalThis, function () {
  'use strict';
  const pluginId = 'StashDesktop';

  function toWindowsPath(source, serverPrefix, windowsPrefix) {
    if (typeof source !== 'string' || typeof serverPrefix !== 'string' || typeof windowsPrefix !== 'string' || !serverPrefix.trim() || !windowsPrefix.trim()) {
      throw new Error('Configure both path prefixes under Settings → Plugins → Stash Desktop.');
    }
    const prefix = serverPrefix.trim().replace(/\/+$/, '');
    if (!serverPrefix.trim().startsWith('/') || serverPrefix.includes('\\') || /[\x00-\x1f]/.test(serverPrefix)) throw new Error('The Stash path prefix must be an absolute server path.');
    if (!source.startsWith(prefix + '/') || source.includes('\\')) throw new Error('No path mapping for this scene file.');
    const relative = source.slice(prefix.length + 1);
    if (!relative || relative.split('/').some(part => !part || part === '.' || part === '..') || /[\x00-\x1f"<>|?*:]/.test(relative)) throw new Error('The scene path cannot be represented safely on Windows.');
    const windows = windowsPrefix.trim().replaceAll('/', '\\');
    if (!/^[A-Za-z]:\\/.test(windows) && !/^\\\\[^\\]+\\[^\\]+(?:\\|$)/.test(windows)) throw new Error('The Windows prefix must be an absolute drive or UNC path.');
    const remainder = /^[A-Za-z]:/.test(windows) ? windows.slice(2) : windows;
    if (/[\x00-\x1f"<>|?*:]/.test(remainder) || windows.split('\\').some(part => part === '.' || part === '..')) throw new Error('Invalid Windows path prefix.');
    return windows.replace(/\\+$/, '') + '\\' + relative.replaceAll('/', '\\');
  }

  function protocolLink(path) {
    const payload = btoa(Array.from(new TextEncoder().encode(path), byte => String.fromCharCode(byte)).join(''));
    return 'stashexplorer://open/' + payload.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }

  function install(window) {
    if (window.__stashDesktopLoaded) return;
    if (window.__stashExplorerLoaded) {
      window.console?.warn('Stash Desktop: disable the old Windows Explorer plugin and reload the page.');
      return;
    }
    window.__stashDesktopLoaded = true;
    window.__stashExplorerLoaded = true;
    const document = window.document;
    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Show in Windows Explorer';
    button.setAttribute('aria-label', button.title);
    button.innerHTML = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>';
    button.className = 'btn btn-secondary';
    button.hidden = true;
    const wrapper = document.createElement('span');
    wrapper.appendChild(button);
    const sceneRoute = () => window.location.pathname.match(/^(.*)\/scenes\/(\d+)\/?$/);
    function update() {
      button.hidden = !sceneRoute();
      if (button.hidden) return;
      const toolbar = document.querySelector('.scene-toolbar');
      const groups = toolbar?.querySelectorAll('.scene-toolbar-group');
      const target = groups?.length ? groups[groups.length - 1] : toolbar;
      if (target && !target.contains(wrapper)) target.insertBefore(wrapper, target.lastElementChild);
    }
    new window.MutationObserver(update).observe(document.body, {childList: true, subtree: true});
    window.addEventListener('popstate', update);
    update();
    async function query(prefix, queryText, variables) {
      const response = await window.fetch(prefix + '/graphql', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: queryText, variables})});
      if (!response.ok) throw new Error('Stash: HTTP ' + response.status);
      const result = await response.json();
      if (result.errors?.length) throw new Error(result.errors.map(error => error.message).join('\n'));
      return result.data;
    }
    button.onclick = async () => {
      const route = sceneRoute();
      if (!route) return;
      button.disabled = true;
      try {
        const [config, scene] = await Promise.all([
          query(route[1], 'query StashDesktopSettings { configuration { plugins } }', {}),
          query(route[1], 'query StashDesktopScene($id: ID!) { findScene(id: $id) { files { path } } }', {id: route[2]})
        ]);
        const all = config.configuration.plugins || {};
        const settings = (all.settings || all)[pluginId] || {};
        const files = scene.findScene?.files || [];
        if (!files.length) throw new Error('No scene file found.');
        let index = 0;
        if (files.length > 1) {
          const answer = window.prompt('Choose a file number:\n' + files.map((file, i) => `${i + 1}: ${file.path}`).join('\n'), '1');
          if (answer === null) return;
          index = Number(answer) - 1;
          if (!Number.isInteger(index) || !files[index]) throw new Error('Invalid file number.');
        }
        window.location.href = protocolLink(toWindowsPath(files[index].path, settings.server_path_prefix, settings.windows_path_prefix));
      } catch (error) {
        window.alert('Stash Desktop: ' + error.message);
      } finally {
        button.disabled = false;
      }
    };
    return {button, update};
  }
  return {toWindowsPath, protocolLink, install};
});
