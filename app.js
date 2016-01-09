'use strict';

const config = require('./config');
const Collins = require('./libs/collins');


let collins = new Collins(config);

collins.start(function(err) {
  console.log('collins is at your service.');
});