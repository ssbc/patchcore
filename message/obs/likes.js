var nest = require('depnest')
var { Value, computed } = require('mutant')

exports.needs = nest({
  'message.sync.unbox': 'first'
})

exports.gives = nest({
  'sbot.hook.feed': true,
  'message.obs.likes': true
})

exports.create = function (api) {
  var likesLookup = {}
  return nest({
    'sbot.hook.feed': (msg) => {
      if (!(msg && msg.value && msg.value.content)) return
      if (typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
        if (!msg) return
      }

      var c = msg.value.content
      if (c.type !== 'vote') return
      if (!c.vote || !c.vote.link) return 

      var likes = get(c.vote.link)()
      var author = msg.value.author
      if (!likes[author] || likes[author][1] < msg.timestamp) {
        likes[author] = [c.vote.value > 0, msg.timestamp]
        get(c.vote.link).set(likes)
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
