const nest = require('depnest')
var pull = require('pull-stream')

exports.gives = nest('feed.pull.public')
exports.needs = nest({
  'sbot.pull.feed': 'first',
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.public', (opts) => {
    // handle last item passed in as lt
    opts.lt = (opts.lt && opts.lt.value)
      ? opts.lt.value.timestamp
      : opts.lt

    const blocking = api.contact.obs.blocking(api.keys.sync.id())

    return pull(
      api.sbot.pull.feed(opts),
      pull.filter(msg => !blocking().includes(msg.value.author))
    )
  })
}
