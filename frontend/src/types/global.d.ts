// Global type declarations for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void;
  }
}

export {};