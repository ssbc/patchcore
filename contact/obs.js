var nest = require('depnest')
var {Value, computed} = require('mutant')
var pull = require('pull-stream')
var ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.gives = nest({
  'contact.obs': ['following', 'followers', 'blocking', 'blockers'],
  'sbot.hook.publish': true
})

exports.create = function (api) {
  var cacheLoading = false
  var cache = {}
  var sync = Value(false)

  return nest({
    'contact.obs': {
      following: (id) => values(get(id), 'following', true),
      followers: (id) => values(get(id), 'followers', true),
      blocking: (id) => values(get(id), 'blocking', true),
      blockers: (id) => values(get(id), 'blockers', true),
    },
    'sbot.hook.publish': function (msg) {
      if (isContact(msg)) {
        // HACK: make interface more responsive when sbot is busy
        var source = msg.value.author
        var dest = msg.value.content.contact
        if (typeof msg.value.content.following === 'boolean') {
          update(source, {
            following: {
              [dest]: [msg.value.content]
            }
          })
          update(dest, {
            followers: {
              [source]: [msg.value.content]
            }
          })
        }
        if (typeof msg.value.content.blocking === 'boolean') {
          update(source, {
            blocking: {
              [dest]: [msg.value.content]
            }
          })
          update(dest, {
            blockers: {
              [source]: [msg.value.content]
            }
          })
        }
      }
    }
  })

  function values (state, key, compare) {
    var obs = computed([state, key, compare], getIds)
    obs.sync = sync
    return obs
  }

  function loadCache () {
    pull(
      api.sbot.pull.stream(sbot => sbot.contacts.stream({live: true})),
      pull.drain(item => {
        for (var target in item) {
          if (ref.isFeed(target)) update(target, item[target])
        }

        if (!sync()) {
          sync.set(true)
        }
      })
    )
  }

  function update (id, values) {
    // values = { following, followers, blocking, blockedBy, ... }
    var state = get(id)
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

  function get (id) {
    if (!ref.isFeed(id)) throw new Error('Contact state requires an id!')
    if (!cacheLoading) {
      cacheLoading = true
      loadCache()
    }
    if (!cache[id]) {
      cache[id] = Value({})
    }
    return cache[id]
  }
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
