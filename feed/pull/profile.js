const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.profile')
exports.needs = nest('sbot.pull.userFeed', 'first')
exports.create = function (api) {
  return nest('feed.pull.profile', (id) => {
    // handle last item passed in as lt
    return function (opts) {
      opts = extend(opts, {
        id, lt: (opts.lt && typeof opts.lt === 'object') ? opts.lt.value.sequence : opts.lt
      })
      return api.sbot.pull.userFeed(opts)
    }
  })
}
