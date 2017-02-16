var {Value, Struct, Dict, computed} = require('mutant')
var pullPause = require('pull-pause')
var pull = require('pull-stream')
var msgs = require('ssb-msgs')
var nest = require('depnest')
var colorHash = new (require('color-hash'))()

exports.needs = nest({
  'sbot.pull.links': 'first',
  'blob.sync.url': 'first',
  'keys.sync.id': 'first'
})
exports.gives = nest({
  'about.obs': [
    'name',
    'description',
    'image',
    'imageUrl',
    'names',
    'images',
    'color'
  ]
})

exports.create = function (api) {
  var cache = {}

  return nest({
    'about.obs': {
      name: (id) => get(id).displayName,
      description: (id) => get(id).description,
      image: (id) => get(id).image,
      imageUrl: (id) => get(id).imageUrl,

      names: (id) => get(id).names,
      images: (id) => get(id).images,
      color: (id) => computed(id, (id) => colorHash.hex(id))
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
  var pauser = pullPause((paused) => {})

  // transparent image
  var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

  var sync = Value(false)
  var yourId = api.keys.sync.id()

  var obs = Struct({
    assignedNames: Dict(),
    assignedImages: Dict(),
    assignedDescriptions: Dict()
  }, {
    onListen: pauser.resume,
    onUnlisten: pauser.pause
  })

  obs.sync = computed([sync, obs], (v) => v)
  obs.displayName = computed([obs.assignedNames, id, yourId, id.slice(1, 10)], socialValue)
  obs.description = computed([obs.assignedDescriptions, id, yourId], socialValue)
  obs.image = computed([obs.assignedImages, id, yourId], socialValue)

  obs.names = computed(obs.assignedNames, indexByValue)
  obs.images = computed(obs.assignedImages, indexByValue)

  obs.imageUrl = computed(obs.image, (blobId) => {
    if (blobId) {
      return api.blob.sync.url(blobId)
    } else {
      return fallbackImageUrl
    }
  })

  pull(
    api.sbot.pull.links({dest: id, rel: 'about', values: true, live: true}),
    pauser,
    pull.drain(function (msg) {
      if (msg.sync) {
        sync.set(true)
      } else {
        if (msg.value.content.name) {
          obs.assignedNames.put(msg.value.author, msg.value.content.name)
        }
        if (msg.value.content.image) {
          var obj = msgs.link(msg.value.content.image, 'blob')
          if (obj && obj.link) {
            obs.assignedImages.put(msg.value.author, obj.link)
          }
        }
        if (msg.value.content.description) {
          obs.assignedDescriptions.put(msg.value.author, msg.value.content.description)
        }
      }
    }, () => {
      sync.set(true)
    })
  )

  return obs
}

function socialValue (lookup, id, yourId, fallback) {
  return lookup[yourId] || lookup[id] || highestRank(lookup) || fallback || null
}

function highestRank (lookup) {
  var indexed = indexByValue(lookup)
  var highestCount = 0
  var currentHighest = null
  Object.keys(indexed).forEach((item) => {
    var count = indexed[item].length
    if (count > highestCount) {
      highestCount = count
      currentHighest = item
    }
  })
  return currentHighest
}

function indexByValue (lookup) {
  var result = {}
  Object.keys(lookup).forEach((key) => {
    var value = lookup[key]
    if (!result[value]) {
      result[value] = []
    }
    result[value].push(key)
  })
  return result
}
