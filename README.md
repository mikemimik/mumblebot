## PLUGINS

```javascript

/* created plugin */
/* file exists inside the ./plugins directory */

// collins-plugin-name.js
'use strict';
module.exports = {
  name: 'collins-plugin-name', /* plugin name */
  triggers: {
    'firstTrigger': function(context) {
      console.log('>> firstTrigger >>');
    },
    'syncTrigger': function(context, done) {
      console.log('this trigger is synchronous');
      done(null);
    },
    'asyncTrigger': function(context, done) {
      setTimeout(() => {
        done(null);
      }
    }
  }
};


// app.js
const Collins = require('collins');
const config = require('./config');

const myPlugin = require('./plugins/collins-plugin-name');

let collins = new Collins(config);

collins.use(myPlugin);

```


```javascript

/* config file */
/* add plugin into config file */

// config.js
'use strict';
module.exports = {
  server: 'mumble-uri',
  username: 'collins',
  password: 'mumble-password',
  plugins: ['collins-plugin-name'],
  ssl: {
    key: 'path-to-key.pem',
    cert: 'path-to-cert.pem'
  },
  debug: false
};

// app.js
const Collins = require('collins');
const config = require('./config');

let collins = new Collins(config);

collins.init();

```