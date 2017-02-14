var nest = require('depnest')
var { Value, computed } = require('mutant')

exports.gives = nest({
  'sbot.hook.feed': true,
  'message.obs.likes': true
})

exports.create = function (api) {
  var likesLookup = {}
  return nest({
    'sbot.hook.feed': (msg) => {
      if (msg.key && msg.value && msg.value.content) {
        var c = msg.value.content
        if (c.type === 'vote') {
          if (msg.value.content.vote && msg.value.content.vote.link) {
            var likes = get(msg.value.content.vote.link)()
            if (!likes[msg.value.author] || likes[msg.value.author][1] < msg.timestamp) {
              likes[msg.value.author] = [msg.value.content.vote.value > 0, msg.timestamp]
              get(msg.value.content.vote.link).set(likes)
            }
          }
        }
      }
    },
    'message.obs.likes': (id) => {
      return computed(get(id), getLikes)
    }
  })

  function get (id) {
    if (!likesLookup[id]) {
      likesLookup[id] = Value({})
    }
    return likesLookup[id]
  }
}

function getLikes (likes) {
  return Object.keys(likes).reduce((result, id) => {
    if (likes[id][0]) {
      result.push(id)
    }
    return result
  }, [])
}
