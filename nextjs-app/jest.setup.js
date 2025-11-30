import "@testing-library/jest-dom";

// Mock window.matchMedia only if window is defined (jsdom environment)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock fetch globally
global.fetch = jest.fn();

// Mock Web APIs for Next.js server components (node environment)
if (typeof Request === "undefined") {
  global.Request = class Request {};
}
if (typeof Response === "undefined") {
  global.Response = class Response {};
}
if (typeof Headers === "undefined") {
  global.Headers = class Headers {};
}
if (typeof FormData === "undefined") {
  global.FormData = class FormData {};
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
