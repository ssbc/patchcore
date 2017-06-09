// this shouldn't really be in patchcore, should be its own module (ssb-backlinks)

var FlumeQueryLinks = require('./lib/flumeview-links-raw')
var ref = require('ssb-ref')
var deepEqual = require('deep-equal')
var extend = require('xtend')
var matchChannel = /^#[^\s#]+$/

var indexes = [
  { key: 'DTS', value: [['dest'], ['timestamp']] },
  { key: 'DTY', value: [['dest'], ['value', 'content', 'type'], ['timestamp']] }
]

var indexVersion = 0

exports.name = 'backlinks'
exports.version = require('../package.json').version
exports.manifest = {
  read: 'source'
}

exports.init = function (ssb, config) {
  return ssb._flumeUse(
    'backlinks',
    FlumeQueryLinks(indexes, extractLinks, indexVersion)
  )
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
