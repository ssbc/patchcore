var nest = require('depnest')
var {Value, onceTrue, computed} = require('mutant')
var defer = require('pull-defer')
var pull = require('pull-stream')
var ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.gives = nest({
  'contact.obs': ['following', 'followers'],
  'sbot.hook.publish': true
})

exports.create = function (api) {
  var cacheLoading = false
  var cache = {}
  var state = {}
  var sync = Value(false)

  return nest({
    'contact.obs': {
      following: (id) => get(id).following,
      followers: (id) => get(id).followers
    },
    'sbot.hook.publish': function (msg) {
      if (isContact(msg)) {
        var source = msg.value.author
        var dest = msg.value.content.contact
        if (typeof msg.value.content.following === 'boolean') {
          get(source).push({
            following: {
              [dest]: [msg.value.content]
            }
          })
          get(dest).push({
            followers: {
              [source]: [msg.value.content]
            }
          })
        }
      }
    }
  })

  function loadCache () {
    pull(
      api.sbot.pull.stream(sbot => sbot.contacts.stream({live: true})),
      pull.drain(item => {
        for (var target in item) {
          if (ref.isFeed(target)) {
            state[target] = item[target]
            if(cache[target])
              get(target).push(item[target])
          }
        }

        if (!sync()) {
          sync.set(true)
        }
      })
    )
  }

  function get (id) {
    if (!ref.isFeed(id)) throw new Error('Contact state requires an id!')
    if (!cacheLoading) {
      cacheLoading = true
      loadCache()
    }
    if (!cache[id]) {
      cache[id] = Contact(api, id, sync)
      cache[id].push(state[id])
    }
    return cache[id]
  }
}

function Contact (api, id, sync) {
  var state = Value({})
  return {
    following: computedIds(state, 'following', true, sync),
    followers: computedIds(state, 'followers', true, sync),
    push: function (values) {
      var lastState = state()
      var changed = false
      for (var key in values) {
        var valuesForKey = lastState[key] = lastState[key] || {}
        for (var dest in values[key]) {
          var value = values[key][dest]
          if (!valuesForKey[dest] || value[1] > valuesForKey[dest][1] || !values[1] || !valuesForKey[dest[1]]) {
            valuesForKey[dest] = value
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

function computedIds (state, key, compare, sync) {
  var obs = computed([state, key, true], getIds)
  obs.sync = sync
  return obs
}

function getIds (state, key, compare) {
  var result = new Set()
  if (state[key]) {
    for (var dest in state[key]) {
      if (state[key][dest][0] === compare) {
        result.add(dest)
      }
    }
  }

  return result
}

function isContact (msg) {
  return msg.value && msg.value.content && msg.value.content.type === 'contact'
}




