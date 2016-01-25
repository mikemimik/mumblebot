'use strict';

// INFO: require collins module
const Collins = require('./libs/collins');

// INFO: require configuration file/folder
const config = require('./config');

// INFO: instantiate collins with config
let collins = new Collins(config);

// INFO: require plugin
const tenMan = require('./plugins/tenMan');

// INFO: use plugin with collins
collins.use(tenMan);

collins.on('initialized', (err, context) => {
  console.log('>>', 'EVENT', 'initialized');
  collins.start();
});

// INFO: initialize collins
collins.init();