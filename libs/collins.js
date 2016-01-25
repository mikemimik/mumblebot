'use strict';
const fs = require('fs');
const mumble = require('mumble');
const _ = require('lodash');
const async = require('async');
const CollinsError = require('./CollinsError');
const listeners = require('./listeners');
const Emitter = require('events');
const events = require('wildcards');
const Util = require('util');


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

  // INFO: can this be here?
  let tasks = {
    'config:ssl': false,
    'plugins': false
  };

  // TODO: once all init events have been collected, emit 'init:done' event
  events(this, 'init:*', function(event, err, context) {
    console.log('>>', 'event:', event, 'err:', err);

    // INFO: is the _actual_ event emitted
    let component = event.slice(event.indexOf(':')+1, event.length);

    // INFO: 'check off' task as complete
    if (_.has(tasks, component)) { tasks[component] = true; }

    // INFO: asyncly check all tasks
    async.forEachOf(tasks, (value, key, eachOf_cb) => {

      // INFO: check value of task, if false; error
      if (!value) {
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
          // this.emit('error', new CollinsError('ConfigError', err), self); // TEST
        }
      } else {
        this.initialized = true;
        this.emit('init:config:ssl', null, this);
      }

    }); // INFO: done async
  } // INFO: done config setup

  /**
   * INITIZLIZE PLUGINS
   */
  async.each(this.plugins, (plugin, each_cb) => {

    // TODO: add triggers from plugin, to this.triggers
    async.forEachOf(plugin.triggers, (value, key, eachOf_cb) => {

      // TODO: test the plugin and make sure it's correctly formatted
      this.triggers[key] = value;
      eachOf_cb(null);
    }, (eachOf_err) => {
      if (eachOf_err) {
        let error = new CollinsError('PluginInitError', eachOf_err);
        throw error;
        // this.emit('error', error, this); // TEST
      }
      each_cb(null);
    });
  }, (each_err) => {
    // TODO: emit plugins loaded event
    this.emit('init:plugins', null, this);
  });
};

/**
 * @summary function to log collins to console with meant for testing
 *
 * @param {message} String - The message to speak.
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
  var output = selftriggers[trigger];
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