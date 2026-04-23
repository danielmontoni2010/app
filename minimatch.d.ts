// Stub to silence TS error for implicit minimatch types
declare module 'minimatch' {
  export = minimatch;
  function minimatch(p: string, pattern: string, options?: minimatch.IOptions): boolean;
  namespace minimatch {
    interface IOptions {
      [key: string]: unknown;
    }
  }
}
