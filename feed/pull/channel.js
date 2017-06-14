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
      var filter = {
        dest: `#${channel}`,
        timestamp: opts.lt
          ? {$lt: opts.lt, $gt: 0}
          : {$gt: 0}
      }

      delete opts.lt

      return api.sbot.pull.backlinks(extend(opts, {
        index: 'DTS', // HACK: force index since flumeview-query is choosing the wrong one
        query: [
          {$filter: filter}
        ]
      }))
    }
  })
}
