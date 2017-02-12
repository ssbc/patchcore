const combine = require('depject')
const apply = require('depject/apply')
const h = require('mutant/h')

const modules = require('./')
var api = entry(combine(modules))

// TODO depject.entry(sockets, {
//   render_feed: 'first',
//   feeds: {
//     public: 'first'
//   }
// })()

require('insert-css')(`
  .Message {
    padding: 20px;
    border-bottom: 1px solid #EEE;
  }

  .Message > header.author {
    font-weight: bold;
  }
`)

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
