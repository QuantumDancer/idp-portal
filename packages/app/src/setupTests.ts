import '@testing-library/jest-dom';

// @xterm/xterm calls canvas.getContext('2d') at module load to detect color support.
// jsdom doesn't implement HTMLCanvasElement, so we stub it out to suppress the error.
HTMLCanvasElement.prototype.getContext = () => null;

// React Router v6 emits deprecation warnings for v7 future flags. Backstage's AppRouter
// doesn't expose a way to set these flags, so we silence the known messages here.
/* eslint-disable no-console */
const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('v7_startTransition') ||
    msg.includes('v7_relativeSplatPath')
  ) {
    return;
  }
  originalWarn(...args);
};
/* eslint-enable no-console */
