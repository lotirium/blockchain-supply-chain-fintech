// Polyfill for CustomEvent in Node.js environment
if (typeof globalThis.CustomEvent !== 'function') {
  class CustomEvent extends Event {
    constructor(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      super(event, params);
      this.detail = params.detail;
    }
  }
  
  globalThis.CustomEvent = CustomEvent;
}

// Ensure Event is available if it's not
if (typeof globalThis.Event !== 'function') {
  class Event {
    constructor(type, params) {
      this.type = type;
      this.bubbles = params?.bubbles ?? false;
      this.cancelable = params?.cancelable ?? false;
      this.composed = params?.composed ?? false;
    }
  }
  
  globalThis.Event = Event;
}

// Ensure EventTarget is available if it's not
if (typeof globalThis.EventTarget !== 'function') {
  const { EventEmitter } = await import('events');
  
  class EventTarget {
    constructor() {
      this._events = new EventEmitter();
    }

    addEventListener(type, listener) {
      this._events.on(type, listener);
    }

    removeEventListener(type, listener) {
      this._events.off(type, listener);
    }

    dispatchEvent(event) {
      this._events.emit(event.type, event);
      return true;
    }
  }
  
  globalThis.EventTarget = EventTarget;
}