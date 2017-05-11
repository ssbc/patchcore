var nest = require('depnest')
var ref = require('ssb-ref')
var { Value, computed } = require('mutant')

exports.needs = nest({
  'message.sync.unbox': 'first'
})

exports.gives = nest({
  'sbot.hook.feed': true,
  'message.obs.dislikes': true
})

exports.create = function (api) {
  var dislikesLookup = {}
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

      var dislikes = get(c.vote.link)()
      var author = msg.value.author
      if (!dislikes[author] || dislikes[author][1] < msg.timestamp) {
        dislikes[author] = [c.vote.value < 0, msg.timestamp]
        get(c.vote.link).set(dislikes)
      }
    },
    'message.obs.dislikes': (id) => {
      if (!ref.isLink(id)) throw new Error('an id must be specified')
      return computed(get(id), getDislikes)
    }
  })

  function get (id) {
    if (!dislikesLookup[id]) {
      dislikesLookup[id] = Value({})
    }
    return dislikesLookup[id]
  }
}

function getDislikes (dislikes) {
  return Object.keys(dislikes).reduce((result, id) => {
    if (dislikes[id][0]) {
      result.push(id)
    }
    return result
  }, [])
}
