const h = require('mutant/h')
const nest = require('depnest')

exports.needs = nest({
  'message.async.name': 'first',
  'sbot.sync.cache': 'first'
})

exports.gives = nest('message.html.backlinks')

exports.create = function (api) {
  return nest('message.html.backlinks', function (msg) {
    var cache = api.sbot.sync.cache()
    var links = []
    for (var k in cache) {
      var _msg = cache[k]
      var mentions = _msg.content.mentions

      if (Array.isArray(mentions)) {
        for (var i = 0; i < mentions.length; i++) {
          if (mentions[i].link === msg.key) {
            links.push(k)
          }
        }
      }
    }

    if (links.length === 0) return null

    var hrefList = h('ul')
    links.forEach(link => {
      api.message.async.name(link, (err, name) => {
        if (err) throw err
        hrefList.appendChild(h('li', [
          h('a -backlink', { href: link }, name)
        ]))
      })
    })
    return h('MessageBacklinks', [
      h('header', 'backlinks:'),
      hrefList
    ])
  })
}
