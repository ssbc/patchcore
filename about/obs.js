var {Value, computed} = require('mutant')
var pull = require('pull-stream')
var nest = require('depnest')
var ref = require('ssb-ref')
var colorHash = new (require('color-hash'))()
var fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

exports.needs = nest({
  'sbot.pull.stream': 'first',
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
    'color',
    'value',
    'values'
  ]
})

exports.create = function (api) {
  var sync = Value(false)
  var cache = null

  return nest({
    'about.obs': {
      // quick helpers, probably should deprecate!
      name: (id) => value(id, 'name', id.slice(1, 10)),
      description: (id) => value(id, 'description'),
      image: (id) => value(id, 'image'),
      names: (id) => values(id, 'name'),
      images: (id) => values(id, 'images'),
      color: (id) => computed(id, (id) => colorHash.hex(id)),
      imageUrl: (id) => computed(value(id, 'image'), (blobId) => {
        return blobId ? api.blob.sync.url(blobId) : fallbackImageUrl
      }),

      // custom abouts (the future!)
      value,
      values
    }
  })

  function value (id, key, defaultValue) {
    if (!ref.isLink(id)) throw new Error('About requires an ssb ref!')
    var yourId = api.keys.sync.id()
    return computed([get(id), key, id, yourId, defaultValue], socialValue)
  }

  function values (id, key) {
    if (!ref.isLink(id)) throw new Error('About requires an ssb ref!')
    return computed([get(id), 'name'], allValues)
  }

  function get (id) {
    if (!ref.isLink(id)) throw new Error('About requires an ssb ref!')
    load()
    if (!cache[id]) {
      cache[id] = Value({})
    }
    return cache[id]
  }

  function load () {
    if (!cache) {
      cache = {}
      pull(
        api.sbot.pull.stream(sbot => sbot.about.stream({live: true})),
        pull.drain(item => {
          for (var target in item) {
            var state = get(target)
            var lastState = state()
            var values = item[target]
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

          if (!sync()) {
            sync.set(true)
          }
        })
      )
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

function allValues (lookup, key) {
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
