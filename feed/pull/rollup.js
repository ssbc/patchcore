// read stream to get events
// for each item, check to see if already rendered root
// accept prioritized list (render these first)

var pull = require('pull-stream')
var nest = require('depnest')
var extend = require('xtend')
var HLRU = require('hashlru')
var resolve = require('mutant/resolve')
var onceTrue = require('mutant/once-true')

exports.needs = nest({
  'backlinks.obs.for': 'first',
  'sbot.async.get': 'first',
  'message.sync.isBlocked': 'first',
  'message.sync.root': 'first',
  'message.sync.unbox': 'first',
})

exports.gives = nest('feed.pull.rollup', true)

exports.create = function (api) {
  // cache mostly just to avoid reading the same roots over and over again
  // not really big enough for multiple refresh cycles
  var cache = HLRU(100)

  return nest('feed.pull.rollup', function (rootFilter) {
    var seen = new Set()
    return pull(
      pull.map(msg => {
        if (msg.value) {
          var root = api.message.sync.root(msg)
          if (!root) {
            // already a root, pass thru!
            return msg
          } else {
            return root
          }
        }
      }),

      // UNIQUE
      pull.filter(idOrMsg => {
        if (idOrMsg) {
          if (idOrMsg.key) idOrMsg = idOrMsg.key
          if (typeof idOrMsg === 'string') {
            var key = idOrMsg
            if (!seen.has(key)) {
              seen.add(key)
              return true
            }
          }
        }
      }),

      // LOOKUP (if needed)
      pull.asyncMap((keyOrMsg, cb) => {
        if (keyOrMsg.value) {
          cb(null, keyOrMsg)
        } else {
          var key = keyOrMsg
          if (cache.has(key)) {
            cb(null, cache.get(key))
          } else {
            api.sbot.async.get(key, (_, value) => {
              var msg = {key, value}
              if (msg.value) {
                cache.set(key, msg)
              }
              cb(null, msg)
            })
          }
        }
      }),

      // UNBOX (if needed)
      pull.map(msg => {
        if (msg.value && typeof msg.value.content === 'string') {
          var unboxed = api.message.sync.unbox(msg)
          if (unboxed) return unboxed
        }
        return msg
      }),

      // FILTER
      pull.filter(msg => msg && msg.value && !api.message.sync.root(msg)),
      pull.filter(rootFilter || (() => true)),
      pull.filter(msg => !api.message.sync.isBlocked(msg))

      // ADD REPLIES
      pull.asyncMap((rootMessage, cb) => {
        // use global backlinks cache
        var backlinks = api.backlinks.obs.for(rootMessage.key)
        onceTrue(backlinks.sync, () => {
          var replies = resolve(backlinks).filter(msg => {
            return api.message.sync.root(msg) === rootMessage.key
              && !api.message.sync.isBlocked(msg)
          })
          cb(null, extend(rootMessage, { replies }))
        })
      })
    )
  })
}
