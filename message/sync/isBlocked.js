const nest = require('depnest')

exports.gives = nest('message.sync.isBlocked')

exports.needs = nest({
  'contact.obs.blocking': 'first'
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  var _myBlocking

  return nest('message.sync.isBlocked', function isBlockedMessage (msg) {
    if (!_myBlocking) {
      const myKey = api.keys.sync.id()
      _myBlocking = api.contact.obs.blocking(myKey) 
    }

    return _myBlocking.includes(msg.value.author)
  })
}

