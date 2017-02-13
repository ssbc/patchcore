const h = require('mutant/h')

exports.needs = {
  message_backlinks: 'first',
  message_author: 'first',
  message_meta: 'map'
}

exports.gives = {
  message_layout: true
}

exports.create = function (api) {
  return {
    message_layout
  }

  function message_layout (msg, opts) {
    if (opts.layout !== 'mini') return
    return h('div', {
      classList: 'Message -mini'
    }, [
      h('header.author', {}, api.message_author(msg, { size: 'mini' })),
      h('section.meta', {}, api.message_meta(msg)),
      h('section.content', {}, opts.content),
      h('section.raw-content')
    ])
  }
}
