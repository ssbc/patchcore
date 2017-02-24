var {Value, Struct, Dict, computed} = require('mutant')
var pullPause = require('pull-pause')
var pull = require('pull-stream')
var msgs = require('ssb-msgs')
var nest = require('depnest')
var colorHash = new (require('color-hash'))()

exports.needs = nest({
  'sbot.pull.query': 'first',
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
  var sync = Value(false)
  var cache = null

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
    if (!cache) {
      cache = {}
      pull(
        api.sbot.pull.query({
          query: [
            {$filter: {
              value: {
                content: {
                  type: 'about'
                }
              }
            }},
            {$map: {
              timestamp: 'timestamp',
              author: ['value', 'author'],
              id: ['value', 'content', 'about'],
              name: ['value', 'content', 'name'],
              image: ['value', 'content', 'image'],
              description: ['value', 'content', 'description']
            }}
          ],
          live: true
        }),
        pull.drain(function (msg) {
          if (msg.sync) {
            sync.set(true)
          } else if (msgs.isLink(msg.id, 'feed')) {
            get(msg.id).push(msg)
          }
        }, () => {
          sync.set(true)
        })
      )
    }
    if (!cache[id]) {
      cache[id] = About(api, id, sync)
    }
    return cache[id]
  }
}

function About (api, id, sync) {
  var pauser = pullPause((paused) => {})

  // transparent image
  var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

  var yourId = api.keys.sync.id()
  var lastestTimestamps = {}

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

  obs.push = push

  return obs

  // scoped

  function push (msg) {
    if (!lastestTimestamps[msg.author]) {
      lastestTimestamps[msg.author] = {
        name: 0, image: 0, description: 0
      }
    }
    if (msg.name && lastestTimestamps[msg.author].name < msg.timestamp) {
      lastestTimestamps[msg.author].name = msg.timestamp
      obs.assignedNames.put(msg.author, msg.name)
    }
    if (msg.image && lastestTimestamps[msg.author].image < msg.timestamp) {
      lastestTimestamps[msg.author].image = msg.timestamp
      var obj = msgs.link(msg.image, 'blob')
      if (obj && obj.link) {
        obs.assignedImages.put(msg.author, obj.link)
      }
    }
    if (msg.description && lastestTimestamps[msg.author].description < msg.timestamp) {
      lastestTimestamps[msg.author].description = msg.timestamp
      obs.assignedDescriptions.put(msg.author, msg.description)
    }
  }
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
