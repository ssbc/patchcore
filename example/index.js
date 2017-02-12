const combine = require('depject')
const apply = require('depject/apply')
const h = require('mutant/h')
const fs = require('fs')

const modules = require('../')
var api = entry(combine(modules))

// TODO depject.entry(sockets, {
//   render_feed: 'first',
//   feeds: {
//     public: 'first'
//   }
// })()

require('insert-css')(fs.readFileSync(__dirname + '/styles.css', 'utf8'))

var app = h('div.App', [
  api.render_feed(api.feeds.public)
])

document.head.appendChild(h('title', 'PATCHCORE :: Example'))
document.body.appendChild(app)

function entry (sockets) {
  return {
    render_feed: apply.first(sockets.render_feed),
    feeds: {
      public: apply.first(sockets.feeds.public)
    }
  }
}
