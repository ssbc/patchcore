var {Value, Struct, computed} = require('mutant')
var Abortable = require('pull-abortable')
var pull = require('pull-stream')
var msgs = require('ssb-msgs')
var visualize = require('visualize-buffer')
var nest = require('depnest')

exports.needs = nest({
  'sbot.pull.userFeed': 'first',
  'blob.sync.url': 'first'
})
exports.gives = nest({
  'about.obs': [
    'name',
    'image',
    'imageUrl'
  ]
})

exports.create = function (api) {
  var cache = {}

  return nest({
    'about.obs': {
      name: (id) => get(id).displayName,
      image: (id) => get(id).image,
      imageUrl: (id) => get(id).imageUrl
    }
  })

  function get (id) {
    if (!cache[id]) {
      cache[id] = About(api, id)
    }
    return cache[id]
  }
}

function About (api, id) {
  // naive about that only looks at what a feed asserts about itself

  var fallbackImageUrl = genImage(id)

  var obs = Struct({
    displayName: Value(id.slice(1, 10)),
    image: Value(genImage(id))
  })

  obs.imageUrl = computed(obs.image, (image) => {
    var obj = msgs.link(image, 'blob')
    if (obj) {
      return api.blob.sync.url(obj.link)
    } else {
      return fallbackImageUrl
    }
  })

  var hasName = false
  var hasImage = false

  var abortable = Abortable()

  // search history
  pull(
    api.sbot.pull.userFeed({reverse: true, id}),
    abortable,
    pull.drain(function (item) {
      update(item)
      if (hasName && obs.image()) {
        abortable.abort()
      }
    })
  )

  // get live changes
  pull(
    api.sbot.pull.userFeed({old: false, id}),
    pull.drain(update)
  )

  return obs

  // scoped

  function update (item) {
    if (item.value && item.value.content.type === 'about' && item.value.content.about === id) {
      if (item.value.content.name) {
        if (!hasName || hasName < item.value.timestamp) {
          hasName = item.value.timestamp
          obs.displayName.set(item.value.content.name)
        }
      }
      if (item.value.content.image) {
        if (!hasImage || hasImage < item.value.timestamp) {
          hasImage = item.value.timestamp
          obs.image.set(item.value.content.image)
        }
      }
    }
  }
}

function genImage (id) {
  return visualize(new Buffer(id.substring(1), 'base64'), 256).src
}
