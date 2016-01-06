'use strict';
const mumble = require('mumble');
const join = require('oxford-join');
// const triggers = require('./triggers');

function Collins(config) {
  this.config = config;
  this.debug = config.debug;

  // TODO: is this the right place for this?
  this.triggers = require('./triggers');
}


/**
 * @summary function to log collins to console with
 *
 * @param {message} String - The message to speak.
 */
Collins.prototype.log = function(data) {
  console.log('>> Collins: ' + data);
};

Collins.prototype.start = function(callback) {
  let self = this;
  self.cb = (callback) ? callback : new Function();

  self.log('connecting');

  mumble.connect(self.config.server, self.config.options, mumbleCB.bind(self));

  function mumbleCB(error, client) {
    if(error) { throw new Error(error); }
    let self = this;
    self.log('connected');

    self.log('authing');
    client.authenticate(self.config.username, self.config.password);
    client.on('initialized', onInit.bind(self));
    client.on('error', function(data) { console.log('error', data); });
    client.on('disconnect', onDisconn.bind(self));

    client.on('ready', onReady.bind(self, client));
    client.on('message', onMessage.bind(client));
    client.on('user-connect', onUserConn);
  }
};

function onUserConn(user) {
  console.log('Collins >> ' + 'sir, a user connected');
};

function onMessage(message, user, scope) {
  let self = this;

  // say('received a message, sir');
  // say('from: ', user.name, user.id, user.session);
  // say('it reads: ' + message);

  // TEST: testing vars
  // console.log('message', message);
  // console.log('user', user);
  // // client, session, name, id, mute, deaf, suppress, selfMute, selfDeaf
  // // hash, recording, prioritySpeaker, channel, _events, _eventCount
  // console.log('scope', scope);
};

function onInit() {
  let self = this;
  self.log('authed + connection initialized');
};

function onDisconn() {
  let self = this;
  self.log('disconnected');
  process.exit(12);
};

function onReady(client) {
  var self = this;
  self.log('at your service');
  // let recipients = {
  //   session: 74
  // };
  // self.sendMessage('at your service', recipients);

  // var users = self.users();
  // users.forEach(function(user) {
  //   console.log(
  //     'id', user.id,
  //     'name', user.name,
  //     'session', user.session
  //   );
  // });
};

// INFO: used for testing
function onAll(data) {
  console.log('event', data.handler, 'data', data.message);
};

module.exports = Collins;