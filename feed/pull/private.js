const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest('feed.pull.private')
exports.needs = nest({
  'sbot.pull.log': 'first',
  'message.sync.unbox': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.private', function (opts) {
    return pull(
      api.sbot.pull.log(opts),
      unbox()
    )
  })

  // scoped

  function unbox () {
    return pull(
      pull.filter(function (msg) {
        return typeof msg.value.content === 'string'
      }),
      pull.map(function (msg) {
        return api.message.sync.unbox(msg)
      }),
      pull.filter(Boolean)
    )
  }
}
