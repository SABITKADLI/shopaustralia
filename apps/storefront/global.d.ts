// Minimal ambient declarations used during initial scaffolding.
// Replace with real types (@types/*) as you add devDependencies.

declare const process: {
  env: { [key: string]: string | undefined };
};

// Allow importing CSS modules and CSS files in Next/React components.
declare module '*.css';
declare module '*.scss';
declare module '*.module.css';
declare module '*.module.scss';

// Static asset imports (images/fonts)
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
