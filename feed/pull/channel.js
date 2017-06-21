const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.channel')
exports.needs = nest({
  'sbot.pull.backlinks': 'first'
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
          timestamp: lt ? {$lt: lt, $gt: 0} : {$gt: 0}
        }
      }

      return api.sbot.pull.backlinks(extend(opts, {
        query: [
          {$filter: filter}
        ]
      }))
    }
  })
}
