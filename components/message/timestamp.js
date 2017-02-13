const h = require('mutant/h') 
const nest = require('depnest')

exports.gives = nest('message.timestamp')
exports.needs = nest('obs.timeAgo', 'first')

exports.create = function (api) {
  return nest('message.timestamp', timestamp)

  function timestamp (msg) {
    return h('a.Timestamp', {
      href: msg.key,
      title: new Date(msg.value.timestamp)
    }, api.obs.timeAgo(msg.value.timestamp))
  }
}

