var nest = require('depnest')
var pull = require('pull-stream')

exports.needs = nest({
  'sbot.pull.query': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest({
  'contact.async': ['follow', 'unfollow', 'followerOf']
})

exports.create = function (api) {
  return nest({
    'contact.async': {follow, unfollow, followerOf}
  })

  function followerOf (source, dest, cb) {
    pull(
      api.sbot.pull.query({query: [
        makeQuery(source, dest),
        {$map: ['value', 'content', 'following']}
      ]}),
      pull.collect(function (err, ary) {
        if (err) return cb(err)
        else cb(null, ary.pop()) // will be true, or undefined/false
      })
    )
  }

  function follow (id, cb) {
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      following: true
    }, cb)
  }

  function unfollow (id, cb) {
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      following: false
    }, cb)
  }
}

function makeQuery (a, b) {
  return {"$filter": {
    value: {
      author: a,
      content: {
        type: 'contact',
        contact: b,
        following: true
      }
    },
  }}
}
