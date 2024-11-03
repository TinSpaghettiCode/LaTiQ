export class EventEmitter {
    private events: { [key: string]: Function[] } = {};
  
    on(event: string, listener: Function): void {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }
  
    once(event: string, listener: Function): void {
      const onceWrapper = (...args: any[]) => {
        listener(...args);
        this.removeListener(event, onceWrapper);
      };
      this.on(event, onceWrapper);
    }
  
    emit(event: string, ...args: any[]): void {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(...args));
      }
    }
  
    removeListener(event: string, listener: Function): void {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(l => l !== listener);
      }
    }
  
    removeAllListeners(event?: string): void {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
      }
    }
  }