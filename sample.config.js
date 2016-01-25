/**
 * Sample configuration file
 * @module collins
 */

module.exports = {
  /** The servers connection uri. */
  server: 'mumble://server-host:server-port',
  /** The username to use on the server. */
  username: 'bot-username',
  /** The password to use for the server. */
  passowrd: 'mumble-password',
  /** The default plugins to use. */
  plugins: [],
  /** The ssl key/cert file paths. */
  ssl: {
    /** Path to key.pem file. */
    key: 'path/to/ssl/key.pem',
    /** Path to cert.pem file. */
    cert: 'path/to/ssl/cert.pem'
  },
  /** Flag for debug console output. */
  debug: false
};