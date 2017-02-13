var h = require('mutant/h')

exports.needs = {
  message_layout: 'first',
  message_decorate: 'reduce',
  message_link: 'first',
  markdown: 'first'
}

exports.gives = {
  message_render: true
}

exports.create = function (api) {
  return {
    message_render
  }

  function message_render (msg) {
    if (msg.value.content.type !== 'vote') return
    var element = api.message_layout(msg, {
      content: render_vote(msg),
      layout: 'mini'
    })

    return api.message_decorate(element, { msg })
  }

  function render_vote (msg) {
    var link = msg.value.content.vote.link
    return [
      msg.value.content.vote.value > 0 ? 'dug' : 'undug', ' ', api.message_link(link)
    ]
  }
}
