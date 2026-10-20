(function () {
  'use strict';
  if (window.__TORCH_SKIN__) return;
  window.__TORCH_SKIN__ = true;
  window.__TORCH_SKIN_VERSION__ = '/*VERSION*/';
  var CSS = /*CSS*/;
  var LOGIN_CSS = /*LOGIN_CSS*/;
  var TORCH_START = 'https://vissle.me/client/start';
  var FONT_URL = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';

  // Bibliothèques vérifiées par empreinte : un fichier modifié sur le CDN n'est pas exécuté.
  function load(src, integrity) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.integrity = integrity; s.crossOrigin = 'anonymous';
      s.onload = resolve; s.onerror = function () { reject(new Error('Could not load or verify ' + src)); };
      document.head.appendChild(s);
    });
  }
  function probeTorch() {
    var probe = document.createElement('script');
    probe.textContent = 'window.__torchRefs = (typeof client !== "undefined" && client && client.event) ? { client: client, chatango: typeof chatango !== "undefined" ? chatango : null, sidebar: typeof sidebar !== "undefined" ? sidebar : null, torch: typeof torch !== "undefined" ? torch : null } : null;';
    document.head.appendChild(probe); probe.remove();
    return !!window.__torchRefs;
  }
  function headline(text) { var h1 = document.querySelector('h1'); if (h1) h1.textContent = text; }
  function addFont() {
    if (document.querySelector('link[href="' + FONT_URL + '"]')) return;
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = FONT_URL;
    document.head.appendChild(font);
  }

  /* Écran de connexion de Torch rhabillé en CSS seul : ses champs, leurs valeurs et ses écouteurs restent intacts. */
  function dressLogin() {
    if (document.getElementById('torch-skin-login') || !document.querySelector('.login-wrapper')) return;
    var theme = null;
    try { theme = (JSON.parse(localStorage.getItem('torch-prototype-prefs')) || {}).theme; } catch (e) { /* stockage indisponible : thème du système */ }
    document.documentElement.classList.toggle('tsk-light', theme === 'light');
    document.documentElement.classList.toggle('tsk-dark', theme === 'dark');
    var style = document.createElement('style');
    style.id = 'torch-skin-login';
    style.textContent = LOGIN_CSS;
    document.head.appendChild(style);
    addFont();
  }
  // Torch remplace tout le contenu de <html> en démarrant : la feuille est reposée dès que son écran apparaît.
  var loginWatch = new MutationObserver(dressLogin);
  loginWatch.observe(document.documentElement, { childList: true, subtree: true });
  dressLogin();

  /* Démarrage de Torch, comme son favori : même script, sans rechargement en boucle en cas d'échec. */
  function startTorch() {
    if (probeTorch() || document.querySelector('script[src^="' + TORCH_START + '"]')) return;
    headline('Loading...');
    var s = document.createElement('script');
    s.src = TORCH_START;
    s.onerror = function () {
      headline('Torch could not be reached. Reload the page to try again.');
      console.error('[torch-skin] could not load ' + TORCH_START);
    };
    document.body.appendChild(s);
  }
  function torchReady() {
    return new Promise(function (resolve, reject) {
      var started = Date.now();
      (function poll() {
        if (probeTorch()) return resolve();
        if (Date.now() - started > 120000) return reject(new Error('Torch did not start within two minutes.'));
        setTimeout(poll, 500);
      })();
    });
  }

  startTorch();
  var react = load('https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js', 'sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z')
    .then(function () { return load('https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js', 'sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1'); });

  Promise.all([react, torchReady()])
    .then(function () {
      // Créée après le démarrage de Torch, qui construit sa page : l'interface ne risque pas d'être effacée.
      var host = document.createElement('div');
      host.id = 'torch-skin';
      // Masquage en style inline : la feuille de Torch peut annuler l'attribut hidden.
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:none !important;';
      document.body.appendChild(host);
      var shadow = host.attachShadow({ mode: 'open' });
      var style = document.createElement('style'); style.textContent = CSS; shadow.appendChild(style);
      var mount = document.createElement('div'); mount.id = 'app'; shadow.appendChild(mount);
      addFont();
      // L'interface reste masquée tant que la session Torch n'est pas ouverte : la connexion se fait sur l'écran de Torch.
      window.__TORCH_SHOW__ = function () {
        loginWatch.disconnect();
        var login = document.getElementById('torch-skin-login');
        if (login) login.remove();
        document.documentElement.classList.remove('tsk-light', 'tsk-dark');
        if (!host.isConnected) document.body.appendChild(host);
        if (!document.getElementById('torch-skin-hide')) {
          var hide = document.createElement('style');
          hide.id = 'torch-skin-hide';
          hide.textContent = 'body > :not(#torch-skin){display:none !important} html,body{overflow:hidden !important}';
          document.head.appendChild(hide);
        }
        host.style.setProperty('display', 'block', 'important');
      };
      window.__TORCH_LIVE__ = true;
      window.__TORCH_ROOT__ = host;
      window.__TORCH_MOUNT__ = mount;
      boot();
      console.info('[torch-skin] attached to Torch. Sign in with the Torch login screen.');
    })
    .catch(function (e) { console.error('[torch-skin] could not start, the original Torch Client stays in place.', e); });

  function boot() {
/*BUNDLE*/
/*APP*/
  }
})();
