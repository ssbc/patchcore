const nest = require('depnest')

exports.needs = nest('sbot.async.get', 'first')
exports.gives = nest('message.async.name')

// needs an async version

exports.create = function (api) {
  return nest('message.async.name', function (id, cb) {
    api.sbot.async.get(id, function (err, value) {
      if (err && err.name === 'NotFoundError') {
        return cb(null, id.substring(0, 10) + '...(missing)')
      } else if (value.content.type === 'post' && typeof value.content.text === 'string') {
        if (value.content.text.trim()) {
          return cb(null, titleFromMarkdown(value.content.text, 40))
        }
      } else if (typeof value.content.text === 'string') {
        return cb(null, value.content.type + ': ' + titleFromMarkdown(value.content.text, 30))
      }

      return cb(null, id.substring(0, 10) + '...')
    })
  })
}

function titleFromMarkdown (text, max) {
  text = text.trim().split('\n', 2).join('\n')
  text = text.replace(/_|`|\*|\#|\[.*?\]|\(\S*?\)/g, '').trim()
  text = text.replace(/\:$/, '')
  text = text.trim().split('\n', 1)[0].trim()
  if (text.length > max) {
    text = text.substring(0, max - 2) + '...'
  }
  return text
}
