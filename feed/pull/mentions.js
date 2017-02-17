const nest = require('depnest')
const extend = require('xtend')
const pull = require('pull-stream')

exports.needs = nest({
  'sbot.pull.log': 'first',
  'message.sync.unbox': 'first',
  'sbot.sync.cache': 'first'
})

exports.gives = nest('feed.pull.mentions')

exports.create = function (api) {
  return nest('feed.pull.mentions', function (id) {
    var cache = api.sbot.sync.cache()

    return function getStream (opts) {
      opts = extend(opts)
      var take = opts.limit
      opts.limit = 5000

      var stream = pull(
        api.sbot.pull.log(opts),
        unboxIfNeeded(),
        pull.filter((msg) => {
          if (!msg) return false
          if (msg.sync) return true
          return msg.value.author !== id && (
            linksToUs(msg.value.content.mentions) ||
            belongsToUs(msg.value.content.root) ||
            belongsToUs(msg.value.content.branch) ||
            belongsToUs(msg.value.content.repo) ||
            belongsToUs(msg.value.content.vote) ||
            belongsToUs(msg.value.content.about) ||
            belongsToUs(msg.value.content.contact)
          )
        }),
        pull.through(x => console.log())
      )

      if (take) {
        return pull(
          stream,
          pull.take(take)
        )
      } else {
        return stream
      }
    }

    function linksToUs (ids) {
      if (ids) {
        if (Array.isArray(ids)) {
          return ids.some((item) => {
            if (item) {
              return item === id || item.link === id
            }
          })
        } else {
          return ids === id
        }
      }
    }

    function belongsToUs (link) {
      if (link) {
        link = typeof link === 'object' ? link.link : link
        if (link === id) return true
        var item = cache[link]
        if (item) {
          return (item.author === id)
        }
      }
    }
  })

  function unboxIfNeeded () {
    return pull.map(function (msg) {
      if (msg.sync || (msg.value && typeof msg.value.content === 'object')) {
        return msg
      } else {
        return api.message.sync.unbox(msg)
      }
    })
  }
}
