/**
 * Collins Module
 * @module collins
 * @see module:collins
 */

'use strict';
const fs = require('fs');
const path = require('path');
const Util = require('util');
const mumble = require('mumble');
const _ = require('lodash');
const async = require('async');
const Emitter = require('events');
const events = require('wildcards');
const CollinsError = require('./CollinsError');
const listeners = require('./listeners');
const Loader = require('../utils/Loader');


class Collins extends Emitter.EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.debug = config.debug;
    this.initialized = false;
    this.plugins = config.plugins;
    this.triggers = new Object;
    this.Runtime = require('../utils/Runtime');

    if (!this.config.server) {
      let error = new CollinsError('ConfigError', 'Please supply server property.');
      throw error;
    }

    // TODO: check that server uri is valid (regex)

    // INFO: set defaults for config
    _.defaults(this.config, {
      username: 'collins',
      plugins: [],
      debug: false
    });
  }

  /**
 * @summary function to initialize Collins
 *
 */
  init() {
    // INFO: catch 'done:init' event
    events(this, 'done:init', (event, err, context) => {
      context.initialized = true;
      context.emit('initialized', err, context);
    });

    // INFO: start loading
    Loader.start(this);
    Loader.initializeConfig(this);
    Loader.initializePlugins(this);
    Loader.initializeTriggers(this);
  }

  /**
   * @summary function to log collins' output to console
   *
   * @param {object|array|string|number} data The message to speak.
   */
  log(data) {
    let prefix = '>> Collins: ';
    let output = checkType(data);

    console.log(prefix + output);
    /**
     * @summary synchronous function for checking type
     */
    function checkType(input) {
      switch (typeof input) {
        case 'string':
          return input;
          break;
        case 'number':
          return String(input);
          break;
        case 'object': // object or array
          if (_.isArray(data)) {
            data.forEach((item) => {
              return checkType(item);
            });
          } else {
            try {
              return JSON.stringify(data);
            } catch(e) {
              return '<failed to parse object>';
            }
          }
          break;
      }
    }
  }

  /**
   * @summary function to add a plugin (middleware)
   *
   * @param {object} plugin The plugin module to include
   */
  use(plugin) {
    this.plugins.push(plugin);
  }

  /**
   * @summary function to start Collins
   *
   */
  start() {
    // TODO: find the appropriate place to call the callback
    let self = this;
    self.log('Sir, I\'m attempting to connect.');
    mumble.connect(self.config.server, self.config.ssl, mumbleCB.bind(self));

    // INFO: all behaviour for Collins lives here
    function mumbleCB(error, client) {
      if (error) { throw new Error(error); }
      let self = this;
      self.log('I\'ve connected, sir.');

      self.log('The server requires authentication.');
      client.authenticate(self.config.username, self.config.password);

      client.on('initialized', listeners.onInit.bind(self));
      client.on('error', (data) => { console.log('error', data); });
      client.on('disconnect', listeners.onDisconn.bind(self));
      client.on('ready', listeners.onReady.bind(self));

      /**
       * INFO:
       *  - bind function `onMessage` with
       *    - self: instance of Collins
       *    - _, _, _,: place holders for the params for this event
       *    - client: instance of
       */
      // TODO: clean this up
      client.on('message', _.bind(listeners.onMessage, self, _, _, _, client));
      client.on('user-connect', listeners.onUserConn.bind(self));
      // client.on('protocol-in', onAll); // INFO: used for testing
    }
  }

  doTrigger(trigger, payload, client) {
    let self = this; // INFO: instance of collins
    let output = self.triggers[trigger];

    if (typeof output === 'function') {

      // TODO: execute function
      // INFO: function ultimately needs to return a string
      self.log('Got a trigger which is a function to be executed.');
      output = 'exec function.';
    } else if (typeof output === 'string') {

      // INFO: nothing needs to be done?
      // INFO: output is already a string we can send
    }

    let recipients = {
      session: (payload.from.user.session) ? [payload.from.user.session] : [],
      channel_id: (payload.from.channel.id) ? [payload.from.channel.id] : []
    };
    client.sendMessage(output, recipients);
  }
}

// INFO: used for testing
function onAll(data) {
  if (data.handler !== 'ping'
    // && data.handler !== 'userState'
    && data.handler !== 'channelState'
    && data.handler !== 'serverSync'
    && data.handler !== 'cryptSetup') {
    console.log('event', data.handler, 'data', data.message);
  }

};

module.exports = Collins;
