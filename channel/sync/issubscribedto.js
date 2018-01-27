var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
})

exports.gives = nest('channel.sync.isSubscribedTo')

exports.create = function (api) {
  return nest('channel.sync.isSubscribedTo', isSubscribedTo)

  function isSubscribedTo (channel, cb) {
    const myId = api.keys.sync.id()
        
    const { subscribed } = api.channel.obs
    const myChannels = subscribed(myId)
    let v = myChannels().values()
    return [...v].includes(channel)
  }
}
