var nest = require('depnest')
var MutantPullReduce = require('mutant-pull-reduce')
var ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.query': 'first',
  'keys.sync.id': 'first'
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
        if (from) from.push({id: contact, value: following, timestamp: msg.timestamp})
        if (to) to.push({id: author, value: following, timestamp: msg.timestamp})
      }
    }
  })

  function following (id) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
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
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
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
  var newestValues = {}
  return MutantPullReduce(stream, (result, item) => {
    if (!ref.isFeed(item.id)) return
    newestValues[item.id] = newestValues[item.id] || 0
    if (newestValues[item.id] < item.timestamp) {
      newestValues[item.id] = item.timestamp
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
