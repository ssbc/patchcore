const pull = require('pull-stream')
const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.private')
exports.needs = nest({
  'sbot.pull.log': 'first',
  'message.sync.unbox': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.private', function (opts) {
    var opts = extend(opts)

    // handle limit to ensure we're getting old private messages
    var limit = opts.limit
    delete opts.limit

    var stream = pull(
      api.sbot.pull.log(opts),
      unbox()
    )

    if (limit) {
      return pull(
        stream,
        pull.take(limit)
      )
    } else {
      return stream
    }
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
