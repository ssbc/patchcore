const combine = require('depject')
const apply = require('depject/apply')
const h = require('mutant/h')
const fs = require('fs')
const Path = require('path')

const modules = require('../')
var api = entry(combine(modules))

// TODO depject.entry(sockets, {
//   render_feed: 'first',
//   feeds: {
//     public: 'first'
//   }
// })()

require('insert-css')(fs.readFileSync(Path.join(__dirname, 'styles.css'), 'utf8'))

var app = h('div.App', [
  api.feed.html.render(api.feed.pull.public)
])

document.head.appendChild(h('title', 'PATCHCORE :: Example'))
document.body.appendChild(app)

function entry (sockets) {
  return {
    feed: {
      html: {
        render: apply.first(sockets.feed.html.render)
      },
      pull: {
        public: apply.first(sockets.feed.pull.public)
      }
    }
  }
}
