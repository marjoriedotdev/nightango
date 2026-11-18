import { AvatarDecorCtx, h, useContext, useEffect } from '../core/globals.js';
import { ApiCtx, Ctx, useApp, useAppApi } from '../core/ui.js';
import { paneShown } from '../core/selectors.js';
import { closePipWindow, pipOpen, renderInPip } from './pip-window.js';
import { SidePane } from './shell.js';
import { Layers } from '../core/layers.js';
// -- Floating conversation -----------------------------------------------------

/**
 * Renders the popped out conversation into the floating window, with the contexts of the application.
 * It renders nothing in the page.
 */
export function PipHost() {
  var app = useApp(), api = useAppApi(), decor = useContext(AvatarDecorCtx), target = app.state.pip;
  useEffect(function () {
    // Signed out, or the conversation went away: the window closes.
    if (!app.state.auth.loggedIn || !target || !paneShown(app.state, target)) { if (pipOpen()) closePipWindow(); return; }
    renderInPip(function (mount) { return h(Layers, { mount: mount }, h(ApiCtx.Provider, { value: api }, h(AvatarDecorCtx.Provider, { value: decor }, h(Ctx.Provider, { value: app },
      h('div', { className: 'pip' }, h(SidePane, { route: target, role: 'floating' })))))); });
  });
  return null;
}
