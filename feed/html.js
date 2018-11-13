const pull = require('pull-stream')
const h = require('mutant/h')
const nest = require('depnest')

exports.needs = nest({
  'message.html.render': 'first',
  'sbot.pull.log': 'first'
})

exports.gives = nest('feed.html.render')

exports.create = function (api) {
  return nest('feed.html.render', function renderFeed (stream) {
    const container = h('div')

    pull(
      stream({ reverse: true, limit: 100 }),
      pull.drain(msg => container.appendChild(api.message.html.render(msg)))
    )

    return container
  })
}
