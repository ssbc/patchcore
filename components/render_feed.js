const pull = require('pull-stream')
const h = require('mutant/h')

exports.needs = {
  message_render: 'first',
  sbot_log: 'first'
}

exports.gives = {
  render_feed: true
}

exports.create = function (api) {
  return {
    render_feed
  }

  function render_feed (stream) {
    const container = h('div')

    pull(
      stream({reverse: true, limit: 100}),
      pull.drain(msg => container.appendChild(api.message_render(msg)))
    )

    return container
  }
}
