const renderer = require('ssb-markdown')
const h = require('mutant/h')
const ref = require('ssb-ref')
const nest = require('depnest')
var htmlEscape = require('html-escape')
var watch = require('mutant/watch')

exports.needs = nest({
  'blob.sync.url': 'first',
  'blob.obs.has': 'first',
  'emoji.sync.url': 'first'
})

exports.gives = nest('message.html.markdown')

exports.create = function (api) {
  return nest('message.html.markdown', markdown)

  function markdown (content) {
    if (typeof content === 'string') { content = {text: content} }
    // handle patchwork style mentions and custom emoji.
    var mentions = {}
    var emojiMentions = {}
    if (Array.isArray(content.mentions)) {
      content.mentions.forEach(function (link) {
        if (link && link.name && link.link) {
          if (link.emoji) emojiMentions[link.name] = link.link
          else mentions['@' + link.name] = link.link
        }
      })
    }

    return h('Markdown', {
      hooks: [
        LoadingBlobHook(api.blob.obs.has)
      ],
      innerHTML: renderer.block(content.text, {
        emoji: (emoji) => {
          var url = emojiMentions[emoji]
            ? api.blob.sync.url(emojiMentions[emoji])
            : api.emoji.sync.url(emoji)
          return renderEmoji(emoji, url)
        },
        toUrl: (id) => {
          if (ref.isBlob(id)) return api.blob.sync.url(id)
          if (mentions[id]) {
            return mentions[id]
          } else if (ref.isLink(id) || id.startsWith('#') || id.startsWith('?')) {
            return id
          }
          return false
        },
        imageLink: (id) => id
      })
    })
  }

  function renderEmoji (emoji, url) {
    if (!url) return ':' + emoji + ':'
    return `
      <img
        src="${htmlEscape(url)}"
        alt=":${htmlEscape(emoji)}:"
        title=":${htmlEscape(emoji)}:"
        class="emoji"
      >
    `
  }
}

function LoadingBlobHook (hasBlob) {
  return function (element) {
    var releases = []
    element.querySelectorAll('img').forEach(img => {
      var id = ref.extract(img.src)
      if (id) {
        releases.push(watch(hasBlob(id), has => {
          if (has === false) {
            img.classList.add('-pending')
          } else {
            img.classList.remove('-pending')
          }
        }))
      }
    })
    return function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  }
}
