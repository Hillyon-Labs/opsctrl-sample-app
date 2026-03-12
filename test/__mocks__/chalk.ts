/**
 * Mock for the chalk library to avoid issues in Jest tests
 */

// Create a Proxy that returns itself for any property access
const createChalkFn = (): any => {
  const fn: any = (str: string) => str;
  return new Proxy(fn, {
    get: (_target, prop) => {
      // Return the same chainable function for any property
      return fn;
    },
  });
};

const chalk = createChalkFn();

export default chalk;
module.exports = chalk;
