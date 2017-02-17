var h = require('mutant/h')
var pull = require('pull-stream')
var mime = require('simple-mime')('application/octect-stream')
var split = require('split-buffer')
var nest = require('depnest')

module.exports = {
  needs: nest({
    'sbot.async.addBlob': 'first'
  }),
  gives: nest('blob.html.input'),
  create: function (api) {
    return nest('blob.html.input', function FileInput (onAdded) {
      return h('input', { type: 'file',
        'ev-change': function (ev) {
          var file = ev.target.files[0]
          if (!file) return
          var reader = new global.FileReader()
          reader.onload = function () {
            var stream = pull.values(split(new Buffer(reader.result), 64 * 1024))
            api.sbot.async.addBlob(stream, function (err, blob) {
              if (err) return console.error(err)
              onAdded({
                link: blob,
                name: file.name,
                size: reader.result.length || reader.result.byteLength,
                type: mime(file.name)
              })
            })
          }
          reader.readAsArrayBuffer(file)
        }
      })
    })
  }
}
