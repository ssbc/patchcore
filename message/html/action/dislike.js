var { h, computed, when } = require('mutant')
var nest = require('depnest')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.dislikes': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('message.html.action')

exports.create = (api) => {
  return nest('message.html.action', function dislike (msg) {
    var id = api.keys.sync.id()
    var disliked = computed([api.message.obs.dislikes(msg.key), id], doesNotLike)
    return when(disliked,
      h('a.undislike', {
        href: '#',
        'ev-click': () => publishDislike(msg, false)
      }, 'Undislike'),
      h('a.dislike', {
        href: '#',
        'ev-click': () => publishDislike(msg, true)
      }, 'Dislike')
    )
  })

  function publishDislike (msg, status = true) {
    var dig = status ? {
      type: 'vote',
      channel: msg.value.content.channel,
      vote: { link: msg.key, value: -1, expression: 'Shun' }
    } : {
      type: 'vote',
      channel: msg.value.content.channel,
      vote: { link: msg.key, value: 0, expression: 'UnShun' }
    }
    if (msg.value.content.recps) {
      dig.recps = msg.value.content.recps.map(function (e) {
        return e && typeof e !== 'string' ? e.link : e
      })
      dig.private = true
    }
    api.sbot.async.publish(dig)
  }
}

function doesNotLike (likes, userId) {
  const dislikes = likes.filter(like => like)
  return dislikes.includes(userId)
}
