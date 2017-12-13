'use strict'

var nest = require('depnest')
var { Value, computed, when } = require('mutant')
var pull = require('pull-stream')
var ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.stream': 'first',
  'contact.obs.sameAs': 'first'
})

exports.gives = nest({
  'contact.obs': ['following', 'followers', 'blocking', 'blockers'],
  'sbot.hook.publish': true
})

exports.create = function (api) {
  var cacheLoading = false
  var cache = {}
  var reverseCache = {}

  var sync = Value(false)

  return nest({
    'contact.obs': {

      // states:
      //   true = following,
      //   null = neutral (may have unfollowed),
      //   false = blocking

      following: (key) => matchingValueKeys(getMerged(key, cache), true),
      followers: (key) => matchingValueKeys(getMerged(key, reverseCache), true),
      blocking: (key) => matchingValueKeys(getMerged(key, cache), false),
      blockers: (key) => matchingValueKeys(getMerged(key, reverseCache), false)
    },
    'sbot.hook.publish': function (msg) {
      if (!isContact(msg)) return

      // HACK: make interface more responsive when sbot is busy
      var source = msg.value.author
      var dest = msg.value.content.contact
      var tristate = ( // from ssb-friends
        msg.value.content.following ? true
      : msg.value.content.flagged || msg.value.content.blocking ? false
      : null
      )

      update(source, { [dest]: tristate }, cache)
      update(dest, { [source]: tristate }, reverseCache)
    }
  })

  function matchingValueKeys (state, value) {
    var obs = computed(state, state => {
      if (!state) return []
      return Object.keys(state).filter(key => {
        return state[key] === value
      })
    })

    obs.sync = sync
    return obs
  }

  function loadCache () {
    pull(
      api.sbot.pull.stream(sbot => sbot.friends.stream({live: true})),
      pull.drain(item => {
        if (!sync()) {
          // populate observable cache
          var reverse = {}
          for (var source in item) {
            if (ref.isFeed(source)) {
              update(source, item[source], cache)

              // generate reverse lookup
              for (let dest in item[source]) {
                reverse[dest] = reverse[dest] || {}
                reverse[dest][source] = item[source][dest]
              }
            }
          }

          // populate reverse observable cache
          for (let dest in reverse) {
            update(dest, reverse[dest], reverseCache)
          }

          sync.set(true)
        } else if (item && ref.isFeed(item.from) && ref.isFeed(item.to)) {
          // handle realtime updates
          update(item.from, {[item.to]: item.value}, cache)
          update(item.to, {[item.from]: item.value}, reverseCache)
        }
      })
    )
  }

  function update (sourceId, values, lookup) {
    // ssb-friends: values = {
    //   keyA: true|null|false (friend, neutral, block)
    //   keyB: true|null|false (friend, neutral, block)
    // }
    var state = get(sourceId, lookup)
    var lastState = state()
    var changed = false

    for (var targetId in values) {
      if (values[targetId] !== lastState[targetId]) {
        lastState[targetId] = values[targetId]
        changed = true
      }
    }

    if (changed) {
      state.set(lastState)
    }
  }

  function get (id, lookup) {
    if (!ref.isFeed(id)) throw new Error('Contact state requires an id!')
    checkLoaded()
    if (!lookup[id]) {
      lookup[id] = Value({})
    }
    return lookup[id]
  }

  function getMerged (id, lookup) {
    checkLoaded()
    var ids = api.contact.obs.sameAs(id)
    return proxyOnceTrue([sync, ids.sync], computed([ids], ids => {
      return computed(ids.map(x => get(x, lookup)), (...items) => merge(ids, items))
    }))
  }

  function checkLoaded () {
    if (!cacheLoading) {
      cacheLoading = true
      loadCache()
    }
  }

  function merge (ids, items) {
    if (items.length === 1) return items[0]
    var result = {}
    var keys = new Set()
    items.forEach(item => {
      for (var key in item) {
        keys.add(key)
      }
    })

    keys.forEach(key => {
      if (ids.includes(key)) return // skip our keys

      var values = new Set()
      items.forEach(arg => {
        values.add(arg[key])
      })

      // HACK: cheap and hacky merge!
      // TODO: this needs to handle unfollowing and refollowing and unblocking
      if (values.has(true) && !values.has(false)) {
        result[key] = true
      } else if (values.has(false)) {
        result[key] = false
      } else if (values.has(null)) {
        result[key] = null
      }
    })

    return result
  }
}

function isContact (msg) {
  return msg.value && msg.value.content && msg.value.content.type === 'contact'
}

function proxyOnceTrue (values, obs) {
  return computed(values, (...values) => {
    if (values.every(Boolean)) {
      return obs
    }
  })
}
