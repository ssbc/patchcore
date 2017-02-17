var nest = require('depnest')
var MutantSet = require('mutant/set')

exports.needs = nest({
  'message.sync.unbox': 'first'
})

exports.gives = nest({
  'sbot.hook.feed': true,
  'message.obs.backlinks': true
})

exports.create = function (api) {
  var mentionedLookup = {}
  return nest({
    'sbot.hook.feed': (msg) => {
      if (msg.value && typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
      }
      if (msg && msg.value && msg.value.content && Array.isArray(msg.value.content.mentions)) {
        msg.value.content.mentions.forEach(mention => {
          var link = typeof mention === 'object' ? mention.link : mention
          get(link).add(msg.key)
        })
      }
    },
    'message.obs.backlinks': (id) => get(id)
  })

  function get (id) {
    if (!mentionedLookup[id]) {
      mentionedLookup[id] = MutantSet()
    }
    return mentionedLookup[id]
  }
}
