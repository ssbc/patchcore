var pull = require('pull-stream')
var ref = require('ssb-ref')
var Reconnect = require('pull-reconnect')
var createClient = require('ssb-client')
var createFeed = require('ssb-feed')

var cache = CACHE = {}

exports.needs = {
  config: 'first',
  keys: 'first',
  connection_status: 'map'
}

exports.gives = {
  sbot_log: true,
  sbot_get: true,
  sbot_user_feed: true,
  sbot_query: true,
  sbot_publish: true,
  connection_status: true
}

exports.create = function (api) {
  const config = api.config()
  const keys = api.keys()

  var sbot = null
  var connection_status = []

  var rec = {
    sync: () => {},
    async: () => {},
    source: () => {}
  }

  var rec = Reconnect(function (isConn) {
    function notify (value) {
      isConn(value); api.connection_status(value) //.forEach(function (fn) { fn(value) })
    }

    createClient(keys, {
      manifest: require('./manifest.json'),
      remote: config.remote,
      caps: config.caps
    }, function (err, _sbot) {
      if(err)
        return notify(err)

      sbot = _sbot
      sbot.on('closed', function () {
        sbot = null
        notify(new Error('closed'))
      })

      notify()
    })
  })

  var internal = {
    getLatest: rec.async(function (id, cb) {
      sbot.getLatest(id, cb)
    }),
    add: rec.async(function (msg, cb) {
      sbot.add(msg, cb)
    })
  }

  var feed = createFeed(internal, keys, {remote: true})

  return {
    connection_status: () => connection_status,
    sbot_query: rec.source(query => {
      return sbot.query.read(query)
    }),
    sbot_user_feed: rec.source(opts => {
      return sbot.createUserStream(opts)
    }),
    sbot_get: rec.async(function (key, cb) {
      if('function' !== typeof cb)
        throw new Error('cb must be function')
      if(CACHE[key]) cb(null, CACHE[key])
      else sbot.get(key, function (err, value) {
        if(err) return cb(err)
        cb(null, CACHE[key] = value)
      })
    }),
    sbot_publish: rec.async((content, cb) => {
      if(content.recps)
        content = ssbKeys.box(content, content.recps.map(e => {
          return ref.isFeed(e) ? e : e.link
        }))
      else if(content.mentions)
        content.mentions.forEach(mention => {
          if(ref.isBlob(mention.link)) {
            sbot.blobs.push(mention.link, err => {
              if(err) console.error(err)
            })
          }
        })

      feed.add(content, (err, msg) => {
        if(err) console.error(err)
        else if(!cb) console.log(msg)
        cb && cb(err, msg)
      })
    }),
    sbot_log: rec.source(opts => {
      return pull(
        sbot.createLogStream(opts),
        pull.through(e => {
          CACHE[e.key] = CACHE[e.key] || e.value
        })
      )
    })
  }
}
