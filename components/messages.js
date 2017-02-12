const pull = require('pull-stream')

const h = require('../h')

exports.needs = {
  message_render: 'first',
  sbot_log: 'first'
}

exports.gives = {
  page: true
}

exports.create = function (api) {
  return {
    page
  }

  function page () {
    const container = h('div') 

    pull(
      api.sbot_log({reverse: true, limit: 100}),
      pull.drain(msg => container.appendChild(api.message_render(msg)))
    )

    return container
  }
}

