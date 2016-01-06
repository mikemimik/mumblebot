'use strict';

const config = require('./config');
const Collins = require('./libs/bot');


let collins = new Collins(config);

collins.start(function(err) {
  console.log('collins is at your service.');
});