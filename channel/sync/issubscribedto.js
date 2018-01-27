var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
})

exports.gives = nest('channel.sync.isSubscribedTo')

exports.create = function (api) {
  return nest('channel.sync.isSubscribedTo', isSubscribedTo)

  function isSubscribedTo (channel, id) {
    if (!ref.isFeed(id)) {
      id = api.keys.sync.id()
    }
        
    const { subscribed } = api.channel.obs
    const myChannels = subscribed(id)
    let v = myChannels().values()
    return [...v].includes(channel)
  }
}
