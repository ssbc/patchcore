var nest = require('depnest')
var MutantSet = require('mutant/set')

exports.needs = nest({
  'message.sync.unbox': 'first'
})

exports.gives = nest({
  'sbot.hook.feed': true,
  'message.obs.backlinks': true,
  'message.obs.forks': true
})

exports.create = function (api) {
  var mentionedLookup = {}
  var rootLookup = {}

  return nest({
    'sbot.hook.feed': (msg) => {
      if (msg.value && typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
      }

      if (msg && msg.value && msg.value.content) {
        if (Array.isArray(msg.value.content.mentions)) {
          msg.value.content.mentions.forEach(mention => {
            var link = typeof mention === 'object' ? mention.link : mention
            backlinks(link).add(msg.key)
          })
        }

        var root = msg.value.content.root
        var branch = msg.value.content.branch || root

        // fork or root reply
        if (root && root === branch) {
          forks(root).add(msg.key)
        }
      }
    },
    'message.obs.backlinks': (id) => backlinks(id),
    'message.obs.forks': (id) => forks(id)
  })

  function backlinks (id) {
    if (!mentionedLookup[id]) {
      mentionedLookup[id] = MutantSet()
    }
    return mentionedLookup[id]
  }

  function forks (id) {
    if (!rootLookup[id]) {
      rootLookup[id] = MutantSet()
    }
    return rootLookup[id]
  }
}
