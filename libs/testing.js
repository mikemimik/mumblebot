'use strict';
const CollinsError = require('./CollinsError');

let regError = new Error('Regular Error');
let collinsError = new CollinsError('TestError', 'Error Message.');

console.log('>> regError >> ', regError);
console.log('>> collinsError >> ', collinsError);

throw collinsError;
// process.exit(12);