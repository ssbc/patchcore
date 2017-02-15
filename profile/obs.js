var nest = require('depnest')
var MutantPullReduce = require('mutant-pull-reduce')

exports.needs = nest({
  'sbot.pull.query': 'first'
})

exports.gives = nest({
  'profile.obs': ['following', 'followers']
})

exports.create = function (api) {
  var followingCache = {}
  var followerCache = {}

  return nest({
    'profile.obs': { following, followers }
  })

  function following (id) {
    if (!followingCache[id]) {
      followingCache[id] = reduce(api.sbot.pull.query({
        query: [
          makeQuery(id, { $prefix: '@' }),
          {'$map': ['value', 'content', 'contact']}
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
          {'$map': ['value', 'author']}
        ],
        live: true
      }))
    }
    return followerCache[id]
  }
}

function reduce (stream) {
  return MutantPullReduce(stream, (result, item) => {
    result.add(item)
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
        contact: b,
        following: true
      }
    }
  }}
}
