'use strict'

var nest = require('depnest')
var { Value, computed } = require('mutant')
var pull = require('pull-stream')
var ref = require('ssb-ref')
var sortedArray = require('sorted-array-functions')

exports.needs = nest({
  'keys.sync.id': 'first',
  'sbot.pull.stream': 'first'
})

exports.gives = nest({
  'contact.obs.sameAs': true,
  'contact.obs.rootId': true
})

exports.create = function (api) {
  var lookupLoading = false
  var lookup = {}

  var sync = Value(false)

  return nest({
    'contact.obs.sameAs': sameAs,
    'contact.obs.rootId': rootId
  })

  function rootId (id) {
    return computed([sameAs(id)], first)
  }

  function sameAs (id) {
    if (!ref.isFeed(id)) throw new Error('sameAs requires a feed id!')
    return get(id)
  }

  function loadCache () {
    pull(
      api.sbot.pull.stream(sbot => {
        return sbot.sameAs.stream({live: true})
      }),
      pull.drain(item => {
        if (!item) return
        if (item.sync) {
          sync.set(true)
        } else {
          update(item)
        }
      })
    )
  }

  function update ({from, to, value}) {
    var state = get(from)
    var lastState = state()
    var changed = false
    var currentIndex = lastState.indexOf(to)

    if (value) {
      if (currentIndex < 0) {
        sortedArray.add(lastState, to, compareKeys)
        changed = true
      }
    } else {
      if (currentIndex >= 0) {
        lastState.splice(currentIndex, 1)
        changed = true
      }
    }

    if (changed) {
      state.set(lastState)
    }
  }

  function get (id) {
    if (!lookupLoading) {
      lookupLoading = true
      loadCache()
    }
    if (!lookup[id]) {
      lookup[id] = Value([id], {nextTick: true})
      lookup[id].sync = sync
    }
    return lookup[id]
  }
}

function compareKeys (a, b) {
  return a.localeCompare(b)
}

function first (items) {
  return items[0]
}
