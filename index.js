const bulk = require('bulk-require')
module.exports = bulk(__dirname, [
  './+(config|keys|sbot).js',
  './+(components|plugs|helpers|actions|observables|feeds)/**/*.js'
])
