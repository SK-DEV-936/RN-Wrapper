type Callback = (...args: any[]) => void;

const listeners: Record<string, Callback[]> = {};

export function on(event: string, cb: Callback) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(cb);
  return () => off(event, cb);
}

export function off(event: string, cb: Callback) {
  listeners[event] = (listeners[event] || []).filter(f => f !== cb);
}

export function emit(event: string, ...args: any[]) {
  (listeners[event] || []).slice().forEach(cb => cb(...args));
}

export default {on, off, emit};
