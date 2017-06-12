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
      var filter = {dest: `#${channel}`}

      // HACK: handle lt
      if (opts.lt != null) {
        filter.timestamp = {$lt: opts.lt, $gte: 0}
        delete opts.lt
      }

      return api.sbot.pull.backlinks(extend(opts, {query: [
        {$filter: filter}
      ]}))
    }
  })
}
