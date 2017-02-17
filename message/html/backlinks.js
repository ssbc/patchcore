const h = require('mutant/h')
const map = require('mutant/map')
const computed = require('mutant/computed')
const when = require('mutant/when')
const nest = require('depnest')

exports.needs = nest({
  'message.obs.backlinks': 'first',
  'message.obs.name': 'first',
  'message.async.name': 'first',
  'sbot.sync.cache': 'first'
})

exports.gives = nest('message.html.backlinks')

exports.create = function (api) {
  return nest('message.html.backlinks', function (msg) {
    var backlinks = api.message.obs.backlinks(msg.key)
    return when(computed(backlinks, hasItems),
      h('MessageBacklinks', [
        h('header', 'backlinks:'),
        h('ul', [
          map(backlinks, (link) => {
            return h('li', [
              h('a -backlink', { href: link, title: link }, api.message.obs.name(link))
            ])
          })
        ])
      ])
    )
  })
}

function hasItems (items) {
  return (items && items.length)
}
