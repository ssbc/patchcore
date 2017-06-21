// read stream to get events
// for each item, check to see if already rendered root
// accept prioritized list (render these first)

var pull = require('pull-stream')
var nest = require('depnest')
var extend = require('xtend')

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'sbot.async.get': 'first',
  'message.sync.root': 'first',
  'message.sync.unbox': 'first'
})

exports.gives = nest('feed.pull.rollup', true)

exports.create = function (api) {
  return nest('feed.pull.rollup', function (rootFilter) {
    return pull(
      pull.map(msg => api.message.sync.root(msg) || msg.key),
      pull.unique(),
      Lookup(),
      pull.filter(msg => msg && msg.value && !api.message.sync.root(msg)),
      pull.filter(rootFilter || (() => true)),
      AddReplies()
    )
  })

  // scoped
  function Lookup () {
    return pull.asyncMap((key, cb) => {
      api.sbot.async.get(key, (_, value) => {
        if (value && typeof value.content === 'string') {
          value = api.message.sync.unbox(value)
        }
        cb(null, {key, value})
      })
    })
  }

  function AddReplies () {
    return pull.asyncMap((rootMessage, cb) => {
      pull(
        api.sbot.pull.backlinks({
          query: [{$filter: { dest: rootMessage.key }}]
        }),
        pull.filter(msg => (api.message.sync.root(msg) || rootMessage.key) === rootMessage.key),
        pull.collect((err, replies) => {
          if (err) return cb(err)
          cb(null, extend(rootMessage, { replies }))
        })
      )
    })
  }
}
