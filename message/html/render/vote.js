var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'message.html': {
    decorate: 'reduce',
    layout: 'first',
    link: 'first',
    markdown: 'first'
  }
})

exports.gives = nest('message.html.render')

exports.create = function (api) {
  return nest('message.html.render', message_render)

  function message_render (msg) {
    if (msg.value.content.type !== 'vote') return
    var element = api.message.html.layout(msg, {
      content: render_vote(msg),
      layout: 'mini'
    })

    return api.message.html.decorate(element, { msg })
  }

  function render_vote (msg) {
    var link = msg.value.content.vote.link
    return [
      msg.value.content.vote.value > 0 ? 'dug' : 'undug', ' ', api.message.html.link(link)
    ]
  }
}
