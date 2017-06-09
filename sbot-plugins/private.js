// this shouldn't really be in patchcore, should be its own module (ssb-private)

var ssbKeys = require('ssb-keys')
var FlumeQueryLinks = require('./lib/flumeview-links-raw')
var explain = require('explain-error')
var pull = require('pull-stream')

var indexes = [
  { key: 'TSP', value: ['timestamp'] },
  { key: 'ATY', value: [['value', 'author'], ['value', 'content', 'type'], 'timestamp'] }
]

var indexVersion = 0

exports.name = 'private'
exports.version = require('../package.json').version
exports.manifest = {
  publish: 'async',
  unbox: 'sync',
  read: 'source'
}

exports.init = function (ssb, config) {
  var index = ssb._flumeUse(
    `private-${ssb.id.slice(1, 10)}`,
    FlumeQueryLinks(indexes, (msg, emit) => {
      var value = unbox(msg)
      if (value) {
        emit(value)
      }
    }, indexVersion)
  )

  return {
    read: function (opts) {
      return pull(
        index.read(opts),
        pull.map(unbox)
      )
    },

    unbox: function (msgOrData) {
      if (typeof msgOrData === 'string') {
        try {
          var data = ssbKeys.unbox(msgOrData, ssb.keys.private)
        } catch (e) {
          throw explain(e, 'failed to decrypt')
        }
        return data
      } else if (msgOrData && msgOrData.value && msgOrData.value.content === 'string') {
        return unbox(msgOrData)
      }
    },

    publish: function (content, recps, cb) {
      try {
        var ciphertext = ssbKeys.box(content, recps)
      } catch (e) {
        return cb(explain(e, 'failed to encrypt'))
      }
      ssb.publish(ciphertext, cb)
    }
  }

  function unbox (msg) {
    if (typeof msg.value.content === 'string') {
      var value = unboxValue(msg.value)
      if (value) {
        return {
          key: msg.key, value: value, timestamp: msg.timestamp
        }
      }
    }
  }

  function unboxValue (value) {
    var plaintext = null
    try {
      plaintext = ssbKeys.unbox(value.content, ssb.keys.private)
    } catch (ex) {}
    if (!plaintext) return null
    return {
      previous: value.previous,
      author: value.author,
      sequence: value.sequence,
      timestamp: value.timestamp,
      hash: value.hash,
      content: plaintext,
      private: true
    }
  }
}
