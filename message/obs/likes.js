var nest = require('depnest')
var ref = require('ssb-ref')
var MutantPullReduce = require('mutant-pull-reduce')
var SortedArray = require('sorted-array-functions')

var { computed } = require('mutant')

exports.needs = nest({
  'message.sync.unbox': 'first',
  'sbot.pull.backlinks': 'first'
})

exports.gives = nest({
  'sbot.hook.publish': true,
  'message.obs.likes': true
})

exports.create = function (api) {
  var activeLikes = new Set()
  return nest({
    'sbot.hook.publish': (msg) => {
      if (!(msg && msg.value && msg.value.content)) return
      if (typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
        if (!msg) return
      }

      var c = msg.value.content
      if (c.type !== 'vote') return
      if (!c.vote || !c.vote.link) return

      activeLikes.forEach((likes) => {
        if (likes.id === c.vote.link) {
          likes.push({
            dest: c.vote.link,
            id: msg.key,
            expression: c.vote.expression,
            value: c.vote.value,
            timestamp: msg.value.timestamp,
            author: msg.value.author
          })
        }
      })
    },
    'message.obs.likes': (id) => {
      if (!ref.isLink(id)) throw new Error('an id must be specified')
      var obs = get(id)
      obs.id = id
      return computed(obs, getLikes, {
        // allow manual append for simulated realtime
        onListen: () => activeLikes.add(obs),
        onUnlisten: () => activeLikes.delete(obs)
      })
    }
  })

  function get (id) {
    var likes = MutantPullReduce(api.sbot.pull.backlinks({
      live: true,
      query: [
        {$filter: {
          dest: id,
          value: {
            content: {
              type: 'vote',
              vote: { link: id }
            }
          }
        }},
        {$map: {
          dest: 'dest',
          id: 'key',
          expression: ['value', 'content', 'vote', 'expression'],
          value: ['value', 'content', 'vote', 'value'],
          timestamp: 'timestamp',
          author: ['value', 'author']
        }}
      ]
    }), (result, msg) => {
      if (!result[msg.author]) {
        result[msg.author] = []
      }
      SortedArray.add(result[msg.author], msg, mostRecent)
      return result
    }, {
      startValue: []
    })
    return likes
  }
}

function getLikes (likes) {
  return Object.keys(likes).reduce((result, id) => {
    if (likes[id][0].value) {
      result.push(id)
    }
    return result
  }, [])
}

function mostRecent (a, b) {
  return b.timestamp - a.timestamp
}
