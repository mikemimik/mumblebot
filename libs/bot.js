'use strict';
const mumble = require('mumble');
const _ = require('lodash');
const async = require('async');
const listeners = require('./listeners');
// const triggers = require('./triggers');


function Collins(config) {
  this.config = config;
  this.debug = config.debug;

  // TODO: is this the right place for this?
  this.triggers = require('./triggers');
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

Collins.prototype.start = function(callback) {
  let self = this;
  self.cb = (callback) ? callback : new Function();

  self.log('Sir, I\'m attempting to connect.');

  mumble.connect(self.config.server, self.config.options, mumbleCB.bind(self));

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
  var output = self.triggers[trigger];
  let recipients = {
    session: (payload.from.user.session) ? [ payload.from.user.session] : [],
    channel_id: (payload.from.channel.id) ? [ payload.from.channel.id ] : []
  };
  client.sendMessage(output, recipients);
};

// INFO: used for testing
function onAll(data) {
  if (data.handler !== 'ping'
    && data.handler !== 'userState'
    && data.handler !== 'channelState'
    && data.handler !== 'serverSync'
    && data.handler !== 'cryptSetup') {
    console.log('event', data.handler, 'data', data.message);
  }

};

module.exports = Collins;