'use strict';

// const util = require('util');


class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * @summary Error class for delivering errors with Collins
 *
 * @param {String} type - Error type name.
 * @param {Object} data
 */
class CollinsError extends ExtendableError {
  constructor(type, data) {
    super('constructor');
    // this.name = 'CollinsError';
    this.data = data;
    // INFO: Construct the error message.

    // INFO: Start with the default message common for all errors.
    this.message = '\'' + name + '\' caused an error';

    let reason = data.details || data.reason;
    if (reason) {

      // INFO: The reason was present in the data. Insert it on its own line.
      this.message += ':\n"' + reason + '"\n\n';
    } else {

      // INFO: No reason. Finish the message line.
      this.message += '. ';
    }

    // INFO: Finish the error message with instructions to check the 'data' field.
    this.message += 'See \'data\' for details.';
  }
};

// let CollinsError = function(name, data) {
//   Error.call(this);
//   Error.captureStackTrace(this, CollinsError);

//   this.name = 'CollinsError';
//   this.data = data;

//   // INFO: Construct the error message.

//   // INFO: Start with the default message common for all errors.
//   this.message = '\'' + name + '\' caused an error';

//   // INFO: Check if the error data contained textual reason.
//   let reason = data.details || data.reason;
//   if (reason) {

//     // INFO: The reason was present in the data. Insert it on its own line.
//     this.message += ':\n"' + reason + '"\n\n';
//   } else {

//     // INFO: No reason. Finish the message line.
//     this.message += '. ';
//   }

//   // INFO: Finish the error message with instructions to check the 'data' field.
//   this.message += 'See \'data\' for details.';
// };

// util.inherits(CollinsError, Error);

module.exports = CollinsError;