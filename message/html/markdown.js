const renderer = require('ssb-markdown')
const fs = require('fs')
const h = require('mutant/h')
const ref = require('ssb-ref')
const nest = require('depnest')

exports.needs = nest({
  'blob.sync.url': 'first',
  'emoji.sync.url': 'first'
})

exports.gives = nest('message.html.markdown')

exports.create = function (api) {
  return nest('message.html.markdown', markdown)

  function markdown (content) {
    if (typeof content === 'string') { content = {text: content} }
    // handle patchwork style mentions.
    var mentions = {}
    if (Array.isArray(content.mentions)) {
      content.mentions.forEach(function (link) {
        if (link.name) mentions['@' + link.name] = link.link
      })
    }

    var md = h('div', {className: 'Markdown'})
    md.innerHTML = renderer.block(content.text, {
      emoji: renderEmoji,
      toUrl: (id) => {
        if (ref.isBlob(id)) return api.blob.sync.url(id)
        return '#' + (mentions[id] ? mentions[id] : id)
      },
      imageLink: (id) => '#' + id
    })

    return md
  }

  function renderEmoji (emoji) {
    var url = api.emoji.sync.url(emoji)
    if (!url) return ':' + emoji + ':'
    return `
      <img
        src="${encodeURI(url)}"
        alt=":${escape(emoji)}:"
        title=":${escape(emoji)}:"
        class="emoji"
      >
    `
  }
}
