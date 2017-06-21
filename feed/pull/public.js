const nest = require('depnest')

exports.gives = nest('feed.pull.public')
exports.needs = nest('sbot.pull.feed', 'first')
exports.create = function (api) {
  return nest('feed.pull.public', (opts) => {
    // handle last item passed in as lt
    opts.lt = (opts.lt && opts.lt.value)
      ? opts.lt.value.timestamp
      : opts.lt
    return api.sbot.pull.feed(opts)
  })
}
