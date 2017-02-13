const nest = require('depnest')

exports.gives = nest('feed.pull.public')
exports.needs = nest('sbot.pull.log', 'first')
exports.create = function (api) {
  return nest('feed.pull.public', api.sbot.pull.log)
}
