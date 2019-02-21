var nest = require('depnest')
var Value = require('mutant/value')
var computed = require('mutant/computed')
var Abortable = require('pull-abortable')
var resolve = require('mutant/resolve')
var pull = require('pull-stream')
var onceIdle = require('mutant/once-idle')

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'sbot.ooo.get': 'first'
})

exports.gives = nest('backlinks.obs.for', true)

exports.create = function (api) {
  var cache = {}

  // cycle remove sets for fast cleanup
  var newRemove = new Set()
  var oldRemove = new Set()

  // run cache cleanup every 5 seconds
  // an item will be removed from cache between 5 - 10 seconds after release
  // this ensures that the data is still available for a page reload
  var timer = setInterval(() => {
    oldRemove.forEach(id => {
      if (cache[id]) {
        cache[id].destroy()
        delete cache[id]
      }
    })
    oldRemove.clear()

    // cycle
    var hold = oldRemove
    oldRemove = newRemove
    newRemove = hold
  }, 5e3)

  if (timer.unref) timer.unref()

  return nest({
    'backlinks.obs.for': (id) => backlinks(id)
  })

  function backlinks (id) {
    if (!cache[id]) {
      var sync = Value(false)
      var aborter = Abortable()
      var collection = Value([])

      // try not to saturate the thread
      onceIdle(() => {
        pull(
          api.sbot.pull.backlinks({
            query: [ { $filter: { dest: id } } ],
            index: 'DTA', // use asserted timestamps
            live: true
          }),
          aborter,
          pull.drain((msg) => {
            if (msg.sync) {
              sync.set(true)
            } else {
              var value = resolve(collection)
              value.push(msg)
              collection.set(value)

              // The message may be a response to a message we don't have because it is
              // outside of our follow range. We can fetch those using ssb-ooo.
              var repliesTo = msg.value.content.branch;
              if (repliesTo && !messagesContainId(msg, repliesTo)) {
                tryToUpdateWithMissingMessages(collection, id, repliesTo);
              }
            }
          })
        )
      })

      cache[id] = computed([collection], x => x, {
        onListen: () => use(id),
        onUnlisten: () => release(id)
      })

      cache[id].destroy = aborter.abort
      cache[id].sync = sync
    }
    return cache[id]
  }

  function messagesContainId(messages, msgId) {
    return messages.find(msg => msg.id === msgId)
  }

  function tryToUpdateWithMissingMessages(messagesObservable, rootId, branchId) {

    var timeoutAfterMs = 5000;

    api.sbot.ooo.get(branchId, timeoutAfterMs, (err, result) => {

      // Ignore errors - the user might be offline, or not be connected to anyone that has the message
      if (err) {
        console.log("Error fetching message using ssb-ooo for backlinks observable: ")
        console.log(err)
      } else {

        // If it forks off a message that's a backlink to the root, we don't want to add it to the collection
        // as it's not a direct backlink
        if (result.value.root === rootId) {
          var value = resolve(messagesObservable)

          // We add the newly retrieved message to backlinks observable
          value.push(result)
          messagesObservable.set(value)

          // This message might also be a reply to a message in the thread we don't have, so we fetch this too
          // if this is the case (hurray, recursion.)
          var branch = result.value.content.branch;
          if (branch && !messagesContainId(value, branch)) {
            tryToUpdateWithMissingMessages(messagesObservable, rootId, branchId)
          }
        }
      }

    });
  }

  function use (id) {
    newRemove.delete(id)
    oldRemove.delete(id)
  }

  function release (id) {
    newRemove.add(id)
  }
}
