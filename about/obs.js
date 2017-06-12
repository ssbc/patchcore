var {Value, computed, onceTrue} = require('mutant')
var defer = require('pull-defer')
var pull = require('pull-stream')
var nest = require('depnest')
var ref = require('ssb-ref')
var colorHash = new (require('color-hash'))()

exports.needs = nest({
  'sbot.obs.connection': 'first',
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
  var cache = {}
  var cacheLoading = false

  return nest({
    'about.obs': {
      name: (id) => get(id).name,
      description: (id) => get(id).description,
      image: (id) => get(id).image,
      imageUrl: (id) => get(id).imageUrl,
      names: (id) => get(id).names,
      images: (id) => get(id).images,
      color: (id) => computed(id, (id) => colorHash.hex(id))
    }
  })

  function get (id) {
    if (!ref.isFeed(id)) throw new Error('About requires an id!')
    if (!cacheLoading) {
      cacheLoading = true
      loadCache()
    }
    if (!cache[id]) {
      cache[id] = About(api, id)
    }
    return cache[id]
  }

  function loadCache () {
    pull(
      StreamWhenConnected(api.sbot.obs.connection, sbot => sbot.about.stream({live: true})),
      pull.drain(item => {
        for (var target in item) {
          if (ref.isFeed(target)) {
            get(target).push(item[target])
          }
        }

        if (!sync()) {
          sync.set(true)
        }
      })
    )
  }
}

function About (api, id) {
  // transparent image
  var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

  var state = Value({})
  var yourId = api.keys.sync.id()
  var image = computed([state, 'image', id, yourId], socialValue)
  var name = computed([state, 'name', id, yourId, id.slice(1, 10)], socialValue)
  var description = computed([state, 'description', id, yourId], socialValue)

  return {
    name,
    image,
    description,
    names: computed([state, 'name', id, yourId, id.slice(1, 10)], allValues),
    images: computed([state, 'image', id, yourId], allValues),
    descriptions: computed([state, 'description', id, yourId], allValues),
    imageUrl: computed(image, (blobId) => {
      if (blobId) {
        return api.blob.sync.url(blobId)
      } else {
        return fallbackImageUrl
      }
    }),
    push: function (values) {
      var lastState = state()
      var changed = false
      for (var key in values) {
        var valuesForKey = lastState[key] = lastState[key] || {}
        for (var author in values[key]) {
          var value = values[key][author]
          if (!valuesForKey[author] || value[1] > valuesForKey[author][1]) {
            valuesForKey[author] = value
            changed = true
          }
        }
      }
      if (changed) {
        state.set(lastState)
      }
    }
  }
}

function socialValue (lookup, key, id, yourId, fallback) {
  var result = lookup[key] ? getValue(lookup[key][yourId]) || getValue(lookup[key][id]) || highestRank(lookup[key]) : null
  if (result != null) {
    return result
  } else {
    return fallback || null
  }
}

function allValues (lookup, key, id, yourId) {
  var values = {}
  for (var author in lookup[key]) {
    var value = getValue(lookup[key][author])
    if (value != null) {
      values[value] = values[value] || []
      values[value].push(author)
    }
  }
  return values
}

function highestRank (lookup) {
  var counts = {}
  var highestCount = 0
  var currentHighest = null
  for (var key in lookup) {
    var value = getValue(lookup[key])
    if (value != null) {
      counts[value] = (counts[value] || 0) + 1
      if (counts[value] > highestCount) {
        currentHighest = value
        highestCount = counts[value]
      }
    }
  }
  return currentHighest
}

function getValue (item) {
  if (item && item[0]) {
    if (typeof item[0] === 'string') {
      return item[0]
    } else if (item[0] && item[0].link && ref.isLink(item[0].link)) {
      return item[0].link
    }
  }
}

function StreamWhenConnected (connection, fn) {
  var stream = defer.source()
  onceTrue(connection, function (connection) {
    stream.resolve(fn(connection))
  })
  return stream
}
