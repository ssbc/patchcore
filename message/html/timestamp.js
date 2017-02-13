const h = require('mutant/h')
const nest = require('depnest')

exports.gives = nest('message.html.timestamp')
exports.needs = nest('lib.obs.timeAgo', 'first')

exports.create = function (api) {
  return nest('message.html.timestamp', timestamp)

  function timestamp (msg) {
    return h('a.Timestamp', {
      href: msg.key,
      title: new Date(msg.value.timestamp)
    }, api.lib.obs.timeAgo(msg.value.timestamp))
  }
}

