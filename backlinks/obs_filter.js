var nest = require('depnest')
var pull = require('pull-stream')
var MutantPullReduce = require('mutant-pull-reduce')
var Value = require('mutant/value')

exports.needs = nest({
  'sbot.pull.backlinks': 'first'
})

exports.gives = nest("backlinks.filter.obs", true)

/**
 * sbot.filter.obs returns an observable list of messages that link
 * back to the message with the given message ID (@id). Only messages that
 * pass the filter function are added to the list.
 *
 * When a message arrives, if passing it to the filter function (@filterFn)
 * does not result in it returning 'true' the message is not added to the
 * observable list.
 *
 * A 'sync' observable property is also added to the returned observable
 * which is 'true' when all previously seen messages are caught up with.
 *
 * Note: Unlike backlinks.obs.for this does not cache the observable for
 * callers that supply the same arguments.
 */
exports.create = function(api) {
  function pullFilterReduceObs(id, filterFn) {
    if (!id || typeof(id) !== "string") {
      throw new Error("id must be a string.")
    }

    if (!filterFn || typeof(filterFn) !== "function") {
      throw new Error("filterFn must be a function.")
    }

    var sync = Value(false)

    var msgBacklinks = api.sbot.pull.backlinks({
      query: [{
        $filter: {
          dest: id
        }
      }],
      live: true
    })

    var msgFilter = pull.filter((msg) => {
      // We do not include the 'sync' message which indicates that any
      // further messages are newly gossiped messages in the list of messages.
      if (msg.sync) {
        sync.set(true)
        return false
      } else {
        return filterFn(msg)
      }
    })

    var filteredBacklinks = pull(
      msgBacklinks,
      msgFilter
    )

    var backlinksObs = MutantPullReduce(filteredBacklinks, (state, msg) => {
      state.push(msg)
      return state;
    }, {
      startValue: [],
      nextTick: true
    })

    backlinksObs.sync = sync

    return backlinksObs;
  }

  return nest({
    "backlinks.filter.obs": (id, filterFn) => pullFilterReduceObs(id, filterFn)
  })
}
