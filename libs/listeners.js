'use strict';
const _ = require('lodash');
// INFO: eventually all custom event listeners will live here
/**
 * exports.onMessage = function( ... params ... ) {
 *
 *  // INFO: get instance of Collins
 *  let self = this
 *
 *  // Custom listener code
 * }
 */

exports.onMessage = function(message, user, scope, client) {
  let self = this; // INFO: instance of collins
  let trigList = (self.triggers) ? _.keys(self.triggers) : [];
  let token = /(![A-Z])\w+/ig;

  // INFO: system object
  // INFO: define payload
  let payload = {
    text: null,
    from: {
      user: {
        name: null,
        id: null,
        session: null
      },
      channel: {
        name: null,
        id: null
      }
    },
    to: null,
  };

  // INFO: parse the incoming message
  let actions = message.match(token);

  // INFO: filter off the bang ('!')
  // TODO: curry bang filter with intersection
  actions = _.map(actions, function removeBang(cmd) {
    return cmd.split('!')[1];
  });

  // INFO: diff cmds against list of triggers (intersetion)
  let actionable = _.intersection(actions, trigList);

  // INFO: populate payload
  payload.text = message;
  if (scope === 'private') {
    payload.from.user.name = user.name;
    payload.from.user.id = user.id;
    payload.from.user.session = user.session;
    payload.to = user.id;
  } else {
    payload.from.channel.name = user.channel.name;
    payload.from.channel.id = user.channel.id;
    payload.to = user.session;
  }


  // INFO: take action
  // TODO: make this async
  _.each(actionable, _.bind(self.doTrigger, self, _, payload, client));
};

exports.onUserConn = function(user) {
  let self = this;
  self.log('Sir, a user connected; ' + user.name);
};

exports.onInit = function() {
  let self = this;
  self.log('I\'ve authenticated and initialized the connection');
};

exports.onDisconn = function() {
  let self = this;
  self.log('Sir, I\'ve disconnected from the server.');
  process.exit(12);
};

exports.onReady = function() {
  var self = this;
  self.log('At your service, sir');
  console.log('>>', 'TESTING', 'instance:', self);
};