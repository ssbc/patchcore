const combine = require('depject')
const apply = require('depject/apply')
const h = require('mutant/h')

const modules = require('./')
var api = entry(combine(modules))

// TODO depject.entry(sockets, {
//  app: 'first'
// })()

var app = h('div.App', [
  api.render_feed(api.feeds.public)
])

document.body.appendChild(app)

function entry (sockets) {
  return {
    render_feed: apply.first(sockets.render_feed),
    feeds: {
      public: apply.first(sockets.feeds.public)
    }
  }
}
