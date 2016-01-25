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



let Collins = function Collins(config) {
  this.config = config;
  this.debug = config.debug;
  this.initialized = false;
  this.plugins = config.plugins;
  this.triggers = new Object;

};
Util.inherits(Collins, Emitter.EventEmitter);

/**
 * @summary function to initialize Collins
 *
 */
Collins.prototype.init = function() {
  let tasks = {
    'config:ssl': false,
    'plugins': false
  };

  /**
   * @summary Function to call all events starting with 'init:'
   */
  events(this, 'init:*', (event, err, context) => {
    console.log('>>', 'event:', event, 'err:', err);

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

  /**
   * INITIALIZE CONFIG FILE
   */
  // INFO: we're making assumptions here
  if (this.config.ssl) {

    // INFO: the object is a thing, check the keys
    async.forEachOf(this.config.ssl, (value, key, callback) => {
      if (key !== 'key' && key !== 'cert') {
        let error = new CollinsError('ConfigError', 'Incorrect \'ssl\' config object');
        callback(error);
      } else if (key === 'key' || key === 'cert') {
        fs.readFile(value, 'utf8', (err, data) => {
          if (err) {
            let error = new CollinsError('FileReadError', err);
            callback(error);
          } else {

            // NOTE: we are assuming data is a *.pem file
            this.config.ssl[key] = data;
            callback(null);
          }
        });
      }
    }, (err) => {
      if (err) {

        // INFO: check to see if we made this error
        if (err instanceof CollinsError) {
          throw err;
          // this.emit('error', err, self); // TEST
        } else {

          // INFO: we didn't, so throw CollinsError
          throw new CollinsError('ConfigError', err);
          // this.emit('error', new CollinsError('ConfigError', err), this); // TEST
        }
      } else {
        this.emit('init:config:ssl', null, this);
      }
    }); // INFO: done async
  } // INFO: done config:ssl setup

  /**
   * INITIALIZE PLUGINS
   */
  console.log('>>', 'TESTING', 'pre', 'triggers:', this.triggers);
  console.log('>>', 'TESTING', 'pre', 'plugins:', this.plugins);
  async.each(this.plugins, (plugin, each_cb) => {

    // TODO: if plugin is a string, we haven't loaded it yet
    if (typeof plugin === 'string') {
      // INFO: we haven't loaded plugin

      let pluginPath = path.join(__dirname, '..', 'plugins', plugin + '.js');
      let node =
      // TODO: require file
      let loadedPlugin = require(pluginPath);
      this.plugins = _.pull(this.plugins, plugin);
      this.plugins.push(loadedPlugin);

      // TODO: replace element in array
    }
    console.log('>>', 'TESTING', 'inside-each', 'plugin:', plugin);
    async.forEachOf(plugin.triggers, (action, trigger, eachOf_cb) => {

      console.log('>>', 'TESTING', 'inside-eachOf', 'trigger:', trigger);
      console.log('>>', 'TESTING', 'inside-eachOf', 'action:', action);
      // TODO: test the plugin and make sure it's correctly formatted
      if (typeof action !== 'string' && typeof action !== 'function') {
        // TODO: throw/emit an error about this
      } else if (typeof action === 'function') {
        // TODO: special requirements for function?
        this.triggers[trigger] = action;
      } else if (typeof action === 'string') {
        this.triggers[trigger] = action;
      }
      eachOf_cb(null);
    }, (eachOf_err) => {
    //   if (eachOf_err) {
    //     let error = new CollinsError('PluginInitError', eachOf_err);
    //     throw error;
    //     // this.emit('error', error, this); // TEST
    //   }
      each_cb(null);
    });
  }, (each_err) => {
    // TODO: emit plugins loaded event
    console.log('>>', 'TESTING', 'post', 'triggers:', this.triggers);
    console.log('>>', 'TESTING', 'post', 'plugins:', this.plugins);
    this.emit('init:plugins', null, this);
  });
};

/**
 * @summary function to log collins to console with meant for testing
 *
 * @param {object} data The message to speak.
 */
Collins.prototype.log = function(data) {
  let prefix = '>> Collins: ';
  let output;
  switch (typeof data) {
    case 'string':
      console.log(prefix + data);
      break;
    case 'Array':
      output = data.toString();
      console.log(prefix + output);
      break;
    case 'object':
      if (_.isArray(data)) {
        output = data.toString();
      } else {
        output = JSON.stringify(data);
      }
      console.log(prefix + output);
      break;
  }
};

/**
 * @summary function to add a plugin (middleware)
 *
 * @param {object} plugin The plugin module to include
 */
Collins.prototype.use = function(plugin) {
  this.plugins.push(plugin);
};

// TODO: find the appropriate place to call the callback
Collins.prototype.start = function(callback) {
  let self = this;
  self.cb = (callback) ? callback : new Function();

  self.log('Sir, I\'m attempting to connect.');

  mumble.connect(self.config.server, self.config.ssl, mumbleCB.bind(self));

  // INFO: All behaviour for Collins lives here
  function mumbleCB(error, client) {
    if(error) { throw new Error(error); }
    let self = this;
    self.log('I\'ve connected, sir.');

    self.log('The server requires authentication.');
    client.authenticate(self.config.username, self.config.password);
    client.on('initialized', listeners.onInit.bind(self));
    client.on('error', function(data) { console.log('error', data); });
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
};

Collins.prototype.doTrigger = function(trigger, payload, client) {
  let self = this; // INFO: instance of collins
  let output = self.triggers[trigger];

  if (typeof output === 'function') {

    // TODO: execute function
    // INFO: function ultimately needs to return a string
    self.log('This trigger is a function to be executed.');
    // output = output();
  } else if (typeof output === 'string') {

    // INFO: nothing needs to be done?
    // INFO: output is already a string we can send
  }

  let recipients = {
    session: (payload.from.user.session) ? [ payload.from.user.session] : [],
    channel_id: (payload.from.channel.id) ? [ payload.from.channel.id ] : []
  };
  client.sendMessage(output, recipients);
};

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