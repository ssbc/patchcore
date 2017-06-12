var nest = require('depnest')
var MutantPullReduce = require('mutant-pull-reduce')

exports.needs = nest({
  'sbot.pull.backlinks': 'first'
})

exports.gives = nest('message.obs.backlinks', true)

exports.create = function (api) {
  return nest({
    'message.obs.backlinks': (id) => backlinks(id)
  })

  function backlinks (id) {
    return MutantPullReduce(api.sbot.pull.backlinks({
      query: [
        {$filter: {
          dest: id
        }},
        {$map: {
          dest: 'dest',
          id: 'key',
          timestamp: 'timestamp',
          type: ['value', 'content', 'type'],
          root: ['value', 'content', 'root'],
          branch: ['value', 'content', 'branch'],
          author: ['value', 'author']
        }}
      ]
    }), (result, msg) => {
      if (msg.type !== 'vote' && msg.type !== 'about') {
        result.push(msg)
      }
      return result
    }, {
      startValue: []
    })
  }
}
