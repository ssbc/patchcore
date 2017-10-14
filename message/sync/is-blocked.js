const nest = require('depnest')

exports.gives = nest('message.sync.isBlocked')

exports.needs = nest({
  'contact.obs.blocking': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  var cache = null

  return nest('message.sync.isBlocked', function isBlockedMessage (msg) {
    if (!cache) {
      cache = api.contact.obs.blocking(api.keys.sync.id())
    }

    return cache().includes(msg.value.author)
  })
}
