const nest = require('depnest')
const extend = require('xtend')

exports.gives = nest('feed.pull.type')
exports.needs = nest('sbot.pull.messagesByType', 'first')
exports.create = function (api) {
  return nest('feed.pull.type', (type) => {
    if (typeof type !== 'string') throw new Error('a type must be specified')

    return function (opts) {
      opts = extend(opts, {
        type,
        // handle last item passed in as lt
        lt: typeof opts.lt === 'object' ? opts.lt.timestamp : opts.lt
      })

      return api.sbot.pull.messagesByType(opts)
    }
  })
}
