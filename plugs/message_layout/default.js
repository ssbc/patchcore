const h = require('mutant/h')

exports.needs = {
  message_backlinks: 'first',
  message_author: 'first',
  message_meta: 'map',
  message_action: 'map'
}

exports.gives = {
  message_layout: true
}

exports.create = function (api) {
  return {
    message_layout
  }

  function message_layout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'default')) return
    return h('div', {
      classList: 'Message'
    }, [
      h('header.author', {}, api.message_author(msg)),
      h('section.title', {}, opts.title),
      h('section.meta', {}, api.message_meta(msg)),
      h('section.content', {}, opts.content),
      h('section.raw-content'),
      h('section.action', {}, api.message_action(msg)),
      h('footer.backlinks', {}, api.message_backlinks(msg))
    ])
  }
}
