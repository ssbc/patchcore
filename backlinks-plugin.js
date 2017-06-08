// this shouldn't really be in patchcore, should be its own module

var FlumeQueryLinks = require('./flumeview-links-raw')
var ref = require('ssb-ref')
var deepEqual = require('deep-equal')
var extend = require('xtend')
var matchChannel = /^#[^\s#]+$/

function isString (s) {
  return typeof s === 'string'
}

var indexes = [
  { key: 'DTS', value: [['dest'], ['timestamp']] },
  { key: 'DTY', value: [['dest'], ['value', 'content', 'type'], ['timestamp']] }
]

var indexVersion = 0

exports.name = 'backlinks'
exports.version = require('./package.json').version
exports.manifest = {
  read: 'source'
}

exports.init = function (ssb, config) {
  var s = ssb._flumeUse('backlinks', FlumeQueryLinks(indexes, extractLinks, indexVersion))
  var read = s.read
  s.read = function (opts) {
    if (!opts) opts = {}
    // accept json, makes it easier to query from cli.
    if (isString(opts)) {
      opts = {query: JSON.parse(opts)}
    } else if (isString(opts.query)) {
      opts.query = JSON.parse(opts.query)
    }
    return read(opts)
  }
  return s
}

function extractLinks (msg, emit) {
  var links = new Set()
  walk(msg.value.content, function (path, value) {
    // HACK: handle legacy channel mentions
    if (deepEqual(path, ['channel']) && typeof value === 'string' && value.length < 30) {
      value = `#${value.replace(/\s/g, '')}`
    }

    // TODO: should add channel matching to ref.type
    if (ref.type(value) || isChannel(value)) {
      links.add(value)
    }
  })
  links.forEach(link => {
    emit(extend(msg, {
      dest: link
    }))
  })
}

function isChannel (value) {
  return typeof value === 'string' && value.length < 30 && matchChannel.test(value)
}

function walk (obj, fn, prefix) {
  if (obj && typeof obj === 'object') {
    for (var k in obj) {
      walk(obj[k], fn, (prefix || []).concat(k))
    }
  } else {
    fn(prefix, obj)
  }
}
