import { AvatarDecorCtx, h, useContext, useEffect } from '../core/globals.js';
import { ApiCtx, Ctx, Layers, useApp, useAppApi } from '../core/ui.js';
import { paneShown } from '../core/selectors.js';
import { GroupView } from './group.js';
import { DmThread } from './dm.js';
import { closePipWindow, pipOpen, renderInPip } from './pip-window.js';
// -- Floating conversation -----------------------------------------------------

/**
 * Renders the popped out conversation into the floating window, with the contexts of the application.
 * It renders nothing in the page.
 */
export function PipHost() {
  var app = useApp(), api = useAppApi(), decor = useContext(AvatarDecorCtx), target = app.state.pip;
  useEffect(function () {
    // Signed out, or the conversation went away: the window closes.
    if (!target || !paneShown(app.state, target)) { if (pipOpen()) closePipWindow(); return; }
    renderInPip(function (mount) { return h(Layers, { mount: mount }, h(ApiCtx.Provider, { value: api }, h(AvatarDecorCtx.Provider, { value: decor }, h(Ctx.Provider, { value: app },
      h('div', { className: 'pip' }, target.view === 'group'
        ? h(GroupView, { key: 'pip:' + target.id, gid: target.id, markerTs: target.markerTs, compact: true, onClose: closePipWindow, closeLabel: 'Close the floating window' })
        : h('div', { key: 'pip:' + target.id, className: 'main', style: { flexDirection: 'row' } },
          h(DmThread, { id: target.id, onClose: closePipWindow, closeLabel: 'Close the floating window', column: { open: false, pressed: null, toggle: function () { app.ui.openProfile(target.id, null); } } }))))))); });
  });
  return null;
}
