var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'sbot.async.publish': 'first',
  'channel.obs.subscribed': 'first',
})

exports.gives = nest({
  'channel.async': ['subscribe', 'unsubscribe', 'isSubscribedTo']
})

exports.create = function (api) {
  return nest({
    'channel.async': {subscribe, unsubscribe, isSubscribedTo}
  })

  function subscribe (channel, cb) {
    if (!channel) throw new Error('a channel must be specified')
    api.sbot.async.publish({
      type: 'channel',
      channel: channel,
      subscribed: true
    }, cb)
  }

  function unsubscribe (channel, cb) {
    if (!channel) throw new Error('a channel must be specified')
    api.sbot.async.publish({
      type: 'channel',
      channel: channel,
      subscribed: false
    }, cb)
  }

  function isSubscribedTo (channel, cb) {
    const myId = api.keys.sync.id()
        
    const { subscribed } = api.channel.obs
    const myChannels = subscribed(myId)
    let v = myChannels().values()
    return [...v].includes(channel)
  }
}
