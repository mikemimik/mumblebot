'use strict';
const CollinsError = require('../libs/CollinsError');
const events = require('wildcards');
const async = require('async');
const _ = require('lodash');

class Loader {
  static start(context) {
    let tasks = {
      'config': false,
      'plugins': false
    };

    /**
     * @summary Function to call all events starting with 'init:'
     */
    events(context, 'init:*', (event, err, context) => {

      // INFO: listen for all init events
      console.log('>>', 'event:', event, 'err:', err); // TEST

      // INFO: component is the _actual_ event emitted
      let component = event.slice(event.indexOf(':')+1, event.length);

      // INFO: 'check off' task as complete
      if (_.has(tasks, component)) { tasks[component] = true; }

      // INFO: asyncly check all tasks
      async.forEachOf(tasks, (checked, task, eachOf_cb) => {

        // INFO: check value of task, if false; error
        if (!checked) {
          eachOf_cb('not:done');
        } else {
          eachOf_cb(null);
        }
      }, (eachOf_err) => {

        // INFO: no error, emit done event
        if (!eachOf_err) {
          context.emit('done:init');
        }
      });
    });
  };

  static initializeConfig(context) {

    // INFO: check if server property exists
    if (!context.config.server) {
      let error = new CollinsError('ConfigError', 'Please supply server property.');
      throw error;
    }

    // TODO: check that server uri is valid (regex)

    // INFO: set defaults for config
    _.defaults(context.config, {
      username: 'collins',
      plugins: [],
      debug: false
    });

    // INFO: check if ssl property exists
    if (context.config.ssl) {

      // INFO: check that it's an object
      if (typeof context.config.ssl !== 'object') {
        let error = new CollinsError('ConfigError', 'Incorrect \'ssl\' config object.');
        throw error;
      }

      // INFO: create parellel async function to house all async calls
      async.parellel([
        (par_cb) => {

          // INFO: check that it only has two properties and that they are 'key' and 'cert'
          let props = _.keys(context.config.ssl);
          let validProps = ['key', 'cert'];
          async.each(props, (prop, each_cb) => {
            if (!_.includes(validProps, prop)) {
              each_cb(true);
            } else {
              each_cb(null);
            }
          }, (invalid) => {
            if (invalid) {
              let error = new CollinsError('ConfigError', 'Incorrect \'ssl\' config object.');
              par_cb(error);
            } else {
              par_cb(null);
            }
          });
        }
      ], (par_error, results) => {
        if (par_error) {
          throw par_error;
        }

        // INFO: all async calls are complete, emit complete
        context.emit('init:config', null, context);
      });
    }
  }
}