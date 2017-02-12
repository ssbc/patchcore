var {Value, Struct} = require('mutant')
var Abortable = require('pull-abortable')
var pull = require('pull-stream')

exports.needs = {
  sbot_user_feed: 'first'
}
exports.gives = {
  obs_about_name: true,
  obs_about_image: true
}

exports.create = function (api) {
  var cache = {}

  return {
    obs_about_name: (id) => get(id).displayName,
    obs_about_image: (id) => get(id).image
  }

  function get (id) {
    if (!cache[id]) {
      cache[id] = About(api, id)
    }
    return cache[id]
  }
}

function About (api, id) {
  // naive about that only looks at what a feed asserts about itself

  var obs = Struct({
    displayName: Value(id.slice(0, 10)),
    image: Value()
  })

  var hasName = false
  var hasImage = false

  var abortable = Abortable()

  // search history
  pull(
    api.sbot_user_feed({reverse: true, id}),
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
    api.sbot_user_feed({old: false, id}),
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
