'use strict';
const mumble = require('mumble');
const join = require('oxford-join');
const _ = require('lodash');
const async = require('async');
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

  self.log('connecting');

  mumble.connect(self.config.server, self.config.options, mumbleCB.bind(self));

  // INFO: All behaviour for Collins lives here
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

    /**
     * INFO:
     *  - bind function `onMessage` with
     *    - self: instance of Collins
     *    - _, _, _,: place holders for the params for this event
     *    - client: instance of
     */
    // TODO: clean this up
    client.on('message', _.bind(onMessage, self, _, _, _, client));
    client.on('user-connect', onUserConn);
    // client.on('protocol-in', onAll);
  }
};

function onUserConn(user) {
  console.log('Collins >> ' + 'sir, a user connected');
};

function onMessage(message, user, scope, client) {
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

  /**
   * Parse the incoming message for triggers
   */
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
    console.log('>> TESTING: inside if (private) >> ', user.name);
    payload.from.user.name = user.name;
    payload.from.user.id = user.id;
    payload.from.user.session = user.session;
    payload.to = user.id;
  } else {
    console.log('>> TESTING: inside else (channel) >> ', user.channel.name);
    payload.from.channel.name = user.channel.name;
    payload.from.channel.id = user.channel.id;
    payload.to = user.session;
  }


  // INFO: take action
  // TODO: make this async
  _.each(actionable, _.bind(self.doTrigger, self, _, payload, client));

  // TEST: testing vars
  /* Testing - Block - Start */
  // console.log('message', message);
  // console.log('user', user);
  // // client, session, name, id, mute, deaf, suppress, selfMute, selfDeaf
  // // hash, recording, prioritySpeaker, channel, _events, _eventCount
  // console.log('scope', scope);
  /* Testing - Block - End */

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
  if (data.handler !== 'ping'
    && data.handler !== 'userState'
    && data.handler !== 'channelState'
    && data.handler !== 'serverSync'
    && data.handler !== 'cryptSetup') {
    console.log('event', data.handler, 'data', data.message);
  }

};

module.exports = Collins;