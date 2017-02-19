var nest = require('depnest')
var pull = require('pull-stream')

exports.needs = nest({
  'sbot.pull.query': 'first'
})

exports.gives = nest('contact.async.followerOf')

exports.create = function (api) {
  return nest('contact.async.followerOf', function (source, dest, cb) {
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
  })
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
