export {};

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}
