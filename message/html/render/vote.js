var h = require('mutant/h')
var nest = require('depnest')
var extend = require('xtend')

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
  return nest('message.html.render', vote)

  function vote (msg, opts) {
    if (msg.value.content.type !== 'vote') return
    var element = api.message.html.layout(msg, extend({
      content: renderContent(msg),
      layout: 'mini'
    }, opts))

    return api.message.html.decorate(element, { msg })
  }

  function renderContent (msg) {
    var link = msg.value.content.vote.link
    return [
      msg.value.content.vote.value > 0 ? 'dug' : 'undug', ' ', api.message.html.link(link)
    ]
  }
}
