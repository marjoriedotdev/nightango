var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// In live mode, each member avatar gets its Chatango picture. Groups keep their initial: Chatango serves a "?" picture, not an error, when there is no icon.
// In a season with costumes, member avatars from 24px up wear one.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) {
    var season = useContext(SeasonCtx);
    var costume = season && COSTUMES[season] && !p.square && (p.size || 36) >= 24;
    var extra = {};
    if (p.src === undefined) extra.src = p.square ? null : avatarSrc(p.name, p.size);
    if (costume) extra.decor = h(Costume, { season: season, name: p.name, color: p.color });
    return h(window.Torch.Avatar, Object.assign({}, p, extra));
  }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, useSyncExternalStore = React.useSyncExternalStore, Frag = React.Fragment;
