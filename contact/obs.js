var nest = require('depnest')
var MutantPullReduce = require('mutant-pull-reduce')

exports.needs = nest({
  'sbot.pull.query': 'first'
})

exports.gives = nest({
  'contact.obs': ['following', 'followers'],
  'sbot.hook.feed': true
})

exports.create = function (api) {
  var followingCache = {}
  var followerCache = {}

  return nest({
    'contact.obs': { following, followers },
    'sbot.hook.feed': function (msg) {
      if (isContact(msg) && msg.timestamp) {
        var author = msg.value.author
        var contact = msg.value.content.contact
        var following = msg.value.content.following
        var from = followingCache[author]
        var to = followerCache[contact]
        if (from) from.push({id: author, value: following, timestamp: msg.timestamp})
        if (to) to.push({id: contact, value: following, timestamp: msg.timestamp})
      }
    }
  })

  function following (id) {
    if (!followingCache[id]) {
      followingCache[id] = reduce(api.sbot.pull.query({
        query: [
          makeQuery(id, { $prefix: '@' }),
          {'$map': {
            id: ['value', 'content', 'contact'],
            value: ['value', 'content', 'following'],
            timestamp: 'timestamp'
          }}
        ],
        live: true
      }))
    }
    return followingCache[id]
  }

  function followers (id) {
    if (!followerCache[id]) {
      followerCache[id] = reduce(api.sbot.pull.query({
        query: [
          makeQuery({ $prefix: '@' }, id),
          {'$map': {
            id: ['value', 'author'],
            value: ['value', 'content', 'following'],
            timestamp: 'timestamp'
          }}
        ],
        live: true
      }))
    }
    return followerCache[id]
  }
}

function reduce (stream) {
  var newestValue = 0
  return MutantPullReduce(stream, (result, item) => {
    if (newestValue < item.timestamp) {
      newestValue = item.timestamp
      if (item.value != null) {
        if (item.value) {
          result.add(item.id)
        } else {
          result.delete(item.id)
        }
      }
    }
    return result
  }, {
    startValue: new Set()
  })
}

function makeQuery (a, b) {
  return {'$filter': {
    value: {
      author: a,
      content: {
        type: 'contact',
        contact: b
      }
    }
  }}
}

function isContact (msg) {
  return msg.value && msg.value.content && msg.value.content.type === 'contact'
}
