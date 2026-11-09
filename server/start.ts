// Set production mode before loading the server, without shell-specific syntax.
process.env.NODE_ENV='production';
await import('./index.js');
export {};
