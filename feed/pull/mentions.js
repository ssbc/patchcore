const nest = require('depnest')
const extend = require('xtend')
const pull = require('pull-stream')
const ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.gives = nest('feed.pull.mentions')

exports.create = function (api) {
  return nest('feed.pull.mentions', function (id) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')

    return function getStream (opts) {
      // handle last item passed in as lt
      var lt = (opts.lt && opts.lt.value)
        ? opts.lt.timestamp
        : opts.lt

      opts = extend(opts, {
        lt: undefined,
        query: [
          {$filter: {
            dest: id,
            timestamp: typeof lt === 'number' ? {$lt: lt, $gt: 0} : {$gt: 0}
          }}
        ]
      })

      const blocking = api.contact.obs.blocking(api.keys.sync.id())

      return pull(
        api.sbot.pull.backlinks(opts),
        pull.filter((msg) => !blocking().includes(msg.value.author))
      )
    }
  })
}
