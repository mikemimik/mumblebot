'use strict';

const util = require('util');


/**
 * @summary Error class for delivering errors with Collins
 *
 * @param {String} name - Error type name.
 * @param {Object} data
 */
let CollinsError = function(name, data) {
  Error.call(this);
  Error.captureStackTrace(this, CollinsError);

  this.name = 'CollinsError';
  this.data = data;

  // INFO: Construct the error message.

  // INFO: Start with the default message common for all errors.
  this.message = '\'' + name + '\' caused an error';

  // INFO: Check if the error data contained textual reason.
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
};

util.inherits(CollinsError, Error);

module.exports = CollinsError;