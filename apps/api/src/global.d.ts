// Minimal ambient declarations to allow the API to typecheck before
// installing upstream @types packages. These are intentionally small and
// should be removed once you add proper devDependencies like
// `@types/node` and `@types/express`.

declare module 'express';
declare module 'dotenv';

// Provide a very small `process` shape so accessing process.env doesn't
// trigger a TS error. Replace with `@types/node` in a real setup.
declare const process: {
  env: { [key: string]: string | undefined };
};
