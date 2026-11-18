import { avatarSrc } from '../bridge/live-model.js';
export var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// Decoration an avatar wears, as a function of its props, or null: the costume of the season, provided by Root.
export var AvatarDecorCtx = React.createContext(null);
// Groups keep their initial: Chatango serves a "?" picture, not an error, when there is no icon.
export var T = Object.assign({}, window.Torch, {
  Avatar: function (p) {
    var decor = useContext(AvatarDecorCtx);
    var extra = {};
    if (p.src === undefined) extra.src = p.square ? null : avatarSrc(p.name, p.size);
    var worn = decor && decor(p);
    if (worn) extra.decor = worn;
    return h(window.Torch.Avatar, Object.assign({}, p, extra));
  }
});
export var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, useSyncExternalStore = React.useSyncExternalStore, Frag = React.Fragment;
