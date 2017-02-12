const pull = require('pull-stream')

exports.gives = {
  feeds: {
    private: true
  }
}

exports.needs = {
  sbot_log: 'first',
  //message_unbox: true
}

exports.create = function (api) {
  return {
    feeds: {
      'private': function (opts) {
        pull(
          api.sbot_log(opts)//,
          //unbox()
        )
      }
    }
  }

  // scoped

  function unbox () {
    return pull(
      pull.filter(function (msg) {
        return typeof msg.value.content === 'string'
      }),
      pull.map(function (msg) {
        return api.message_unbox(msg)
      }),
      pull.filter(Boolean)
    )
  }
}
