const nest = require('depnest')
const extend = require('xtend')
const pull = require('pull-stream')
const ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.log': 'first',
  'message.sync.unbox': 'first',
  'sbot.sync.cache': 'first'
})

exports.gives = nest('feed.pull.mentions')

exports.create = function (api) {
  return nest('feed.pull.mentions', function (id) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    var cache = api.sbot.sync.cache()

    return function getStream (opts) {
      opts = extend(opts)
      var take = opts.limit
      opts.limit = 100

      var stream = pull(
        api.sbot.pull.log(opts),
        unboxIfNeeded(),
        pull.filter((msg) => {
          if (!msg) return false
          if (msg.sync) return true
          return msg.value.author !== id && belongsToUs([
            msg.value.content.mentions,
            msg.value.content.root,
            msg.value.content.branch,
            msg.value.content.repo,
            msg.value.content.vote,
            msg.value.content.about,
            msg.value.content.contact
          ])
        })
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

    function belongsToUs (link) {
      if (Array.isArray(link)) {
        return link.some(belongsToUs)
      }
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
