const nest = require('depnest')
const extend = require('xtend')
const pull = require('pull-stream')

exports.gives = nest('feed.pull.type')
exports.needs = nest({
  'sbot.pull.messagesByType': 'first',
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.type', (type) => {
    if (typeof type !== 'string') throw new Error('a type must be specified')

    return function (opts) {
      opts = extend(opts, {
        type,
        // handle last item passed in as lt
        lt: opts.lt && typeof opts.lt === 'object' ? opts.lt.timestamp : opts.lt
      })

      const blocking = api.contact.obs.blocking(api.keys.sync.id())

      return pull(
        api.sbot.pull.messagesByType(opts),
        pull.filter(msg => !blocking().includes(msg.value.author))
      )
    }
  })
}
