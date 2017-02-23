const bulk = require('bulk-require')

module.exports = {
  patchcore: bulk(__dirname, [
    './!(index).js',
    './!(node_modules|example)/**/*.js'
  ])
}
