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
    return nest('blob.html.input', function FileInput (onAdded, opts = {}) {
      return h('input', {
        accept: opts.accept,
        type: 'file',
        'ev-change': function (ev) {
          var file = ev.target.files[0]
          if (!file) return

          if (opts.resize) {
            resize(file, opts.resize, next)
          } else {
            next(null, file)
          }

          function next (err, file) {
            if (err) return console.error(err)
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
        }
      })
    })
  }
}

function resize (file, opts, cb) {
  var image = document.createElement('img')

  image.onload = next
  image.src = global.URL.createObjectURL(file)
  image.style.display = 'block'

  if (image.complete) next()

  function next () {
    var imageHeight = image.height
    var imageWidth = image.width

    var multiplier = (opts.height / image.height)
    if (multiplier * imageWidth < opts.width) {
      multiplier = opts.width / image.width
    }

    var finalWidth = imageWidth * multiplier
    var finalHeight = imageHeight * multiplier

    var offsetX = (finalWidth - opts.width) / 2
    var offsetY = (finalHeight - opts.height) / 2

    var canvas = document.createElement('canvas')
    canvas.width = opts.width
    canvas.height = opts.height
    var ctx = canvas.getContext('2d')
    ctx.drawImage(image, -offsetX, -offsetY, finalWidth, finalHeight)
    canvas.toBlob(blob => {
      blob.name = file.name
      cb(null, blob)
    }, 'image/' + opts.type, 0.85)
  }
}
