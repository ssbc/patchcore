const nest = require('depnest')
const extend = require('xtend')
var pull = require('pull-stream')

exports.gives = nest('feed.pull.channel')
exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.channel', function (channel) {
    if (typeof channel !== 'string') throw new Error('a channel name be specified')

    return function (opts) {
      // handle last item passed in as lt
      var lt = (opts.lt && opts.lt.value)
        ? opts.lt.value.timestamp
        : opts.lt

      delete opts.lt

      var filter = {
        dest: `#${channel}`,
        value: {
          timestamp: typeof lt === 'number' ? {$lt: lt, $gt: 0} : {$gt: 0}
        }
      }

      const blocking = api.contact.obs.blocking(api.keys.sync.id())

      return pull(
        api.sbot.pull.backlinks(extend(opts, {
          query: [
            {$filter: filter}
          ]
        })),
        pull.filter(msg => !blocking().includes(msg.value.author))
      )
    }
  })
}
