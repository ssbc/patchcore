const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.channel')
exports.needs = nest({
  'sbot.pull.query': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.channel', function (channel) {
    return function (opts) {
      return api.sbot.pull.query(extend(opts, {query: [
        {$filter: {value: {content: { channel }}}}
      ]}))
    }
  })
}
