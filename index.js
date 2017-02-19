const bulk = require('bulk-require')
module.exports = {
  patchcore: bulk(__dirname, [
    './+(config|keys|sbot|emoji|invite).js',
    './+(lib|about|feed|message|contact|blob)/**/*.js'
  ])
}
