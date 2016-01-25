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

// INFO: describe what happens after you initialize collins
// collins.on('loaded', (err, self) => {
//   self.log('I\'ve successfully inicialized.');

//   collins.start(function(err) {
//     console.log('collins is at your service.');
//   });
// });

/* TESTING */
collins.on('done:init', () => {
  console.log('>>', 'APP', 'TESTING', 'done:init');
  collins.start((err) => {
    console.log('collins is at your service.');
  });
});

// INFO: initialize collins
collins.init();