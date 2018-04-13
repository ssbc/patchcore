var h = require('mutant/h')
var resolve = require('mutant/resolve')
var onceTrue = require('mutant/once-true')
var pull = require('pull-stream')
var mime = require('simple-mime')('application/octect-stream')
var split = require('split-buffer')
var nest = require('depnest')
var Defer = require('pull-defer')
var BoxStream = require('pull-box-stream')
var crypto = require('crypto')
var zeros = Buffer.alloc(24, 0)

module.exports = {
  needs: nest({
    'sbot.obs.connection': 'first'

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

          var mimeType = mime(file.name)
          var fileName = file.name

          // handle exif orientation data and resize
          getOrientation(file, (orientation) => {
            if (orientation >= 3 || opts.resize) {
              getImage(file, (image) => {
                image = rotate(image, orientation)
                if (opts.resize) {
                  image = resize(image, opts.resize.width, opts.resize.height)
                }
                if (image.toBlob) {
                  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
                    mimeType = 'image/jpeg'
                  }
                  image.toBlob(blob => {
                    next(blob)
                  }, mimeType, 0.85)
                } else {
                  next(file)
                }
              })
            } else {
              // don't process
              next(file)
            }
          })

          function next (file) {
            var reader = new global.FileReader()
            reader.onload = function () {
              var stream = pull.values(split(new Buffer(reader.result), 64 * 1024))
              pull(stream, AddBlob({
                connection: api.sbot.obs.connection,
                encrypt: resolve(opts.private)
              }, (err, blob) => {
                if (err) return console.error(err)
                onAdded({
                  link: blob,
                  name: fileName,
                  size: reader.result.length || reader.result.byteLength,
                  type: mimeType
                })

                ev.target.value = ''
              }))
            }
            reader.readAsArrayBuffer(file)
          }
        }
      })
    })
  }
}

function getImage (file, cb) {
  var image = document.createElement('img')
  image.onload = () => cb(image)
  image.src = global.URL.createObjectURL(file)
  image.style.display = 'block'
  if (image.complete) cb(image)
}

function resize (image, width, height) {
  var imageHeight = image.height
  var imageWidth = image.width

  var multiplier = (height / image.height)
  if (multiplier * imageWidth < width) {
    multiplier = width / image.width
  }

  var finalWidth = imageWidth * multiplier
  var finalHeight = imageHeight * multiplier

  var offsetX = (finalWidth - width) / 2
  var offsetY = (finalHeight - height) / 2

  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.drawImage(image, -offsetX, -offsetY, finalWidth, finalHeight)
  return canvas
}

function getOrientation (file, callback) {
  var reader = new global.FileReader()
  reader.onload = function (e) {
    var view = new DataView(e.target.result)
    if (view.getUint16(0, false) !== 0xFFD8) return callback(-2)
    var length = view.byteLength
    var offset = 2
    while (offset < length) {
      var marker = view.getUint16(offset, false)
      offset += 2
      if (marker === 0xFFE1) {
        if (view.getUint32(offset += 2, false) !== 0x45786966) return callback(-1)
        var little = view.getUint16(offset += 6, false) === 0x4949
        offset += view.getUint32(offset + 4, little)
        var tags = view.getUint16(offset, little)
        offset += 2
        for (var i = 0; i < tags; i++) {
          if (view.getUint16(offset + (i * 12), little) === 0x0112) {
            return callback(view.getUint16(offset + (i * 12) + 8, little))
          }
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break
      } else {
        offset += view.getUint16(offset, false)
      }
    }
    return callback(-1)
  }
  reader.readAsArrayBuffer(file)
}

function rotate (img, orientation) {
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')

  if (orientation === 6 || orientation === 8) {
    canvas.width = img.height
    canvas.height = img.width
    ctx.translate(img.height / 2, img.width / 2)
    if (orientation === 6) {
      ctx.rotate(0.5 * Math.PI)
    } else {
      ctx.rotate(1.5 * Math.PI)
    }
  } else if (orientation === 3) {
    canvas.width = img.width
    canvas.height = img.height
    ctx.rotate(1 * Math.PI)
    ctx.translate(img.width / 2, img.height / 2)
  } else {
    return img
  }

  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  return canvas
}

function AddBlob ({connection, encrypt = false}, cb) {
  var stream = Defer.sink()
  onceTrue(connection, sbot => {
    if (encrypt) {
      // FROM: https://github.com/ssbc/ssb-secret-blob/blob/master/index.js
      // here we need to hash something twice, first, hash the plain text to use as the
      // key. This has the benefit of encrypting deterministically - the same file will
      // have the same hash. This can be used to deduplicate storage, but has privacy
      // implications. I do it here just because it's early days and this makes testing
      // easier.

      stream.resolve(Hash(function (err, buffers, key) {
        if (err) return cb(err)
        pull(
          pull.once(Buffer.concat(buffers)),
          BoxStream.createBoxStream(key, zeros),
          Hash(function (err, buffers, hash) {
            if (err) return cb(err)
            var id = '&' + hash.toString('base64') + '.sha256'
            pull(
              pull.values(buffers),
              sbot.blobs.add(id, function (err) {
                if (err) return cb(err)
                sbot.blobs.push(id, function (err) {
                  if (err) return cb(err)
                  cb(null, id + '?unbox=' + key.toString('base64') + '.boxs')
                })
              })
            )
          })
        )
      }))
    } else {
      stream.resolve(sbot.blobs.add(cb))
    }
  })
  return stream
}

function Hash (cb) {
  var hash = crypto.createHash('sha256')
  var buffers = []
  var hasher = pull.drain(function (data) {
    data = typeof data === 'string' ? new Buffer(data) : data
    buffers.push(data)
    hash.update(data)
  }, function (err) {
    cb(err, buffers, hash.digest())
  })
  return hasher
}
