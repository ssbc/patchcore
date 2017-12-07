var nest = require('depnest')
var pull = require('pull-stream')
var MutantPullReduce = require('mutant-pull-reduce')

exports.needs = nest({
  'sbot.pull.backlinks': 'first'
})

exports.gives = nest('backlinks.obs.filter', true)

/**
 * sbot.obs.filter returns an observable list of messages that link
 * back to the message with the given message ID (@id). Only messages that
 * pass the filter are added to the list.
 *
 * When a message arrives, if a filter function is given in the options (opts.filter)
 * and passing it to the filter function does not result in it returning
 * 'true' the message is not added to the observable list.
 *
 * A 'sync' observable property is also added to the returned observable
 * which is 'true' when all previously seen messages are caught up with.
 *
 * Note: Unlike backlinks.obs.for this does not cache the observable for
 * callers that supply the same arguments.
 */
exports.create = function (api) {
  function pullFilterReduceObs (id, opts) {
    if (!id || typeof (id) !== 'string') {
      throw new Error('id must be a string.')
    }

    var sbotFilter = {
      $filter: {
        dest: id
      }
    }

    var msgBacklinks = api.sbot.pull.backlinks({
      query: [sbotFilter],
      sync: true
    })

    // If a filter function is supplied in the options, we use it to filter
    // the links stream, otherwise we use all the messages from the stream
    var filterFunction = opts && opts.filter ? opts.filter : () => true

    var filteredBacklinks = pull(
      msgBacklinks,
      pull.filter(filterFunction)
    )

    var backlinksObs = MutantPullReduce(filteredBacklinks, (state, msg) => {
      state.push(msg)
      return state
    }, {
      startValue: [],
      nextTick: true,
      sync: true
    })

    return backlinksObs
  }

  return nest({
    'backlinks.obs.filter': (id, opts) => pullFilterReduceObs(id, opts)
  })
}
