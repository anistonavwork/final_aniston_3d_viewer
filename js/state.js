// App state (active model, UI collapsed flags, etc.)
/* Centralized application state & event bus */

export const appState = {
  activeModel: null,
  leftVisible: true,
  rightVisible: true,
  listeners: {},
};

// Simple pub/sub for cross-component messaging
export function on(event, handler) {
  if (!appState.listeners[event]) appState.listeners[event] = [];
  appState.listeners[event].push(handler);
}

export function emit(event, detail = {}) {
  const handlers = appState.listeners[event];
  if (handlers) handlers.forEach(fn => fn(detail));
}
