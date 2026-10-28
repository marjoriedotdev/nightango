var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// In live mode, each member avatar gets its Chatango picture. Groups keep their initial: Chatango serves a "?" picture, not an error, when there is no icon.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) { return h(window.Torch.Avatar, p.src !== undefined ? p : Object.assign({}, p, { src: p.square ? null : avatarSrc(p.name, p.size) })); }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, Frag = React.Fragment;
