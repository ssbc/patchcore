const bulk = require('bulk-require')
module.exports = bulk(__dirname, [
  './+(config|keys|sbot|blob|emoji).js',
  './+(lib|about|feed|message|contact)/**/*.js'
])
