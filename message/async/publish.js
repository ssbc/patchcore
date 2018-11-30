const nest = require('depnest')

exports.gives = nest('message.async.publish')

exports.needs = nest({
  'sbot.async.publish': 'first'
})

exports.create = function (api) {
  return nest('message.async.publish', api.sbot.async.publish)
}
