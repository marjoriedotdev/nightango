var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// In live mode, each member avatar gets its Chatango picture. Groups keep their initial: Chatango serves a "?" picture, not an error, when there is no icon.
// At Halloween, member avatars from 24px up wear a costume.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) {
    var costume = useApp().season === 'halloween' && !p.square && (p.size || 36) >= 24;
    var extra = {};
    if (p.src === undefined) extra.src = p.square ? null : avatarSrc(p.name, p.size);
    if (costume) extra.decor = h(Costume, { name: p.name, color: p.color });
    return h(window.Torch.Avatar, Object.assign({}, p, extra));
  }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, Frag = React.Fragment;
