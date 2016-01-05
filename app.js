'use strict';
const mumble = require('mumble');
const config = require('./config');
const join = require('oxford-join');

console.log('connecting');
mumble.connect(config.server, config.options, function(error, client) {
  if(error) { throw new Error(error); }
  console.log('connected');
  let self = client;

  client.authenticate(config.username, config.password);
  client.on('initialized', onInit);
  client.on('error', function(data) { console.log('error', data); });
  client.on('disconnect', onDisconn);

  // TEST: testing raw data
  // client.on('protocol-in', onAll);
  // client.on('protocol-out', onAll);
  client.on('ready', onReady.bind(self));
  client.on('message', onMessage.bind(self));
  client.on('user-connect', onUserConn);
});
/**
 * @summary function to speak with
 *
 * @param {message} String - The message to speak.
 */
function say(message) {
  let args = Array.prototype.slice.call(arguments);
  let prefix = '>>> Collins >>> ';
  console.log(prefix + join(args));
};

function onUserConn(user) {
  console.log('Collins >> ' + 'sir, a user connected');
};

function onMessage(message, user, scope) {
  let self = this;

  say('received a message, sir');
  say('from: ', user.name, user.id, user.session);
  say('it reads: ' + message);

  // TEST: testing vars
  // console.log('message', message);
  // console.log('user', user);
  // // client, session, name, id, mute, deaf, suppress, selfMute, selfDeaf
  // // hash, recording, prioritySpeaker, channel, _events, _eventCount
  // console.log('scope', scope);
};

function onInit() {
  console.log('connection initialized');
};

function onDisconn() {
  console.log('disconnected');
  process.exit(12);
};

function onReady() {
  var self = this;
  say('at your service');
  let recipients = {
    session: 74
  };
  self.sendMessage('at your service', recipients);

  var users = self.users();
  users.forEach(function(user) {
    console.log(
      'id', user.id,
      'name', user.name,
      'session', user.session
    );
  });
};

// INFO: used for testing
function onAll(data) {
  console.log('event', data.handler, 'data', data.message);
};

