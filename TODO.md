### FILE: bot.js
  - change the way that the module is exported
    - encapsulate the export (function() {}).call(..)
    - ```javascript
      module.exports = function Collins() {
        // ...
      };
      (function collinsInstance() {
        // ...
      }).call(module.exports.prototype);
      ```
    - ES6 exports?

  - Collins flow
    - Start
      - Describe behaviour
        - parse messages
          - contains trigger
            - create payload
            - doTrigger()
          - !contain trigger
            - some function
            - doTrigger()

  - Does mumble module see everything?
    - test with onAll() + 'protocal-in' && 'protocal-out'