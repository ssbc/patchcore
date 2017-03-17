const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.channel')
exports.needs = nest({
  'sbot.pull.query': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.channel', function (channel) {
    if (typeof channel !== 'string') throw new Error('a channel name be specified')

    return function (opts) {
      var filter = {value: {content: { channel }}}
      var query = {query: [
        {$filter: filter}
      ]}

      // HACK: handle lt
      if (opts.lt != null) {
        filter.timestamp = {$lt: opts.lt, $gte: 0, $le: 'hack around dominictarr/map-filter-reduce#1'}
        delete opts.lt
      }

      return api.sbot.pull.query(extend(opts, query))
    }
  })
}
