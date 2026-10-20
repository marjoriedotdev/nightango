var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// En mode live, chaque avatar reçoit la photo Chatango du compte ou du groupe qu'il représente.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) { return h(window.Torch.Avatar, p.src !== undefined ? p : Object.assign({}, p, { src: avatarSrc(p.name, p.size) })); }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, Frag = React.Fragment;
