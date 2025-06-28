import '@testing-library/jest-dom';

// Mock js-yaml for tests
jest.mock('js-yaml', () => ({
  load: jest.fn(),
  loadAll: jest.fn(),
  dump: jest.fn(),
}));

// Mock Canvas API for tests
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    font: '',
    measureText: jest.fn((text: string) => ({ width: text.length * 8 })),
  })),
});

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      getContext: jest.fn(() => ({
        font: '',
        measureText: jest.fn((text: string) => ({ width: text.length * 8 })),
      })),
    } as any;
  }
  return originalCreateElement.call(document, tagName);
}); 