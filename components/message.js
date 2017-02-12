const h = require('../h')

exports.needs = {
  message_components: 'map'
}

exports.gives = {
  message_render: true
}

exports.create = function (api) {
  return {
    message_render,
  }

  function message_render (msg) {
    return h('div', { 
      classList: 'Message',
      style: {
        border: '1px gainsboro solid',
        'border-bottom': 'none',
        padding: '1rem'
      }
    }, api.message_components(msg))
  }
}

