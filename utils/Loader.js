'use strict';
const CollinsError = require('../libs/CollinsError');
const events = require('wildcards');
const async = require('async');
const Path = require('path');
const _ = require('lodash');

class Loader {
  static start(context) {
    context.log('Starting Loader...');

    /**
     * @summary Function to call all events starting with 'init:'
     */
    events(context, 'init:*', (event, err, context) => {

      // INFO: listen for all init events
      console.log('>>', 'CAUGHT EVENT:', event, 'err:', err); // TEST

      // INFO: component is the _actual_ event emitted
      let component = event.slice(event.indexOf(':')+1, event.length);
      console.log('>>', 'CAUGHT EVENT:', 'component:', component); // TEST

      // INFO: 'check off' task as complete
      if (_.has(context.Runtime.configurationTasks, component)) {
        context.Runtime.configurationTasks[component] = true;
      }

      // INFO: asyncly check all tasks
      async.forEachOf(context.Runtime.configurationTasks, (checked, task, eachOf_cb) => {

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
    context.log('Loader:Start -> End?');
  };

  static initializeConfig(context) {
    context.log('Initializing Configuration File...');

    // INFO: check if ssl property exists
    if (context.config.ssl) {

      // INFO: check that it's an object
      if (typeof context.config.ssl !== 'object') {
        let error = new CollinsError('ConfigError', 'Incorrect \'ssl\' config object.');
        throw error;
      }

      // INFO: create parellel async function to house all async calls
      async.parallel([
        (parallel_cb) => {

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
              parallel_cb(error);
            } else {
              parallel_cb(null);
            }
          });
        }
      ], (parallel_error, results) => {
        if (parallel_error) {
          throw parallel_error;
        }

        // INFO: all async calls are complete, emit complete
        context.emit('init:config', null, context);
      });
    }
  }

  static initializePlugins(context) {
    if (context.Runtime.configurationTasks.config) {

      // INFO: file has already been processed
      context.log('Initializing Plugins...');
      next(context);
    } else {
      context.log('Waiting for Configuration File Process...');

      // INFO: need to wait for config file to finish processing
      context.on('init:config', (error, context) => {
        context.log('Initializing Plugins...');
        next(context);
      });
    }
    function next(context) {
      async.each(context.plugins, (plugin, each_cb) => {
        if (typeof plugin === 'string') {
          let pluginPath = Path.join(__dirname, '..', 'plugins', plugin + '.js');
          const loadedPlugin = require(pluginPath);
          context.plugins = _.pull(context.plugins, plugin);
          context.plugins.push(loadedPlugin);
        }
        each_cb(null);
      }, (each_err) => {
        context.emit('init:plugins', null, context);
      });
    }
  }

  static initializeTriggers(context) {
    context.log('Initializing Triggers...');
    async.each(context.plugins, (plugin, plugin_cb) => {
      async.forEachOf(plugin.triggers, (action, trigger, trigger_cb) => {
        if (typeof action !== 'string' && typeof action !== 'function') {
          trigger_cb(trigger);
        } else if (typeof action === 'function') {
          context.triggers[trigger] = action;
        } else if (typeof action === 'string') {
          context.triggers[trigger] = action;
        }
        trigger_cb(null);
      }, (trigger_err) => {

        // INFO: if true, trigger threw error, pass to outer async and throw plugin error
        if (trigger_err) {
          plugin_cb(trigger_err);
        } else {
          plugin_cb(null);
        }
      });
    }, (plugin_err) => {
      if (plugin_err) {
        let error = new CollinsError('TriggerError', 'Invalid trigger action: ' + plugin_err);
        throw error;
      }
      context.emit('init:triggers', null, context);
    });
  }
}

module.exports = Loader;