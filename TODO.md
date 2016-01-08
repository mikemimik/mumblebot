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