const emojis = require('emoji-named-characters')
const emojiNames = Object.keys(emojis)
const nest = require('depnest')

exports.needs = nest('blob.sync.url', 'first')
exports.gives = nest({
  'emoji.sync': [
    'names',
    'url'
  ]
})

exports.create = function (api) {
  return nest({
    'emoji.sync': {
      names,
      url
    }
  })

  function names () {
    return emojiNames
  }

  function url (emoji) {
    return emoji in emojis &&
      api.blob.sync.url(emoji).replace(/\/blobs\/get/, '/img/emoji') + '.png'
  }
}
