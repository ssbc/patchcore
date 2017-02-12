const h = require('mutant/h')

exports.needs = {
  message_backlinks: 'first',
  message_author: 'first',
  message_meta: 'map',
  message_action: 'map'
}

exports.gives = {
  message_layout: true
}

exports.create = function (api) {
  return {
    message_layout
  }

  function message_layout (msg, opts) {
    if (opts.mini) {
      return mini(msg, opts)
    } else {
      return full(msg, opts)
    }
  }

  // scoped

  function full (msg, opts) {
    var msgEl = h('div', {
      classList: 'Message',
      'ev-keydown': navigateToMessageOnEnter,
      attributes: {
        tabindex: '0',
        'data-key': msg.key,
        'data-text': msg.value.content.text
      }
    }, [
      h('header.author', {}, api.message_author(msg)),
      h('section.title', {}, opts.title),
      h('section.meta', {}, api.message_meta(msg)),
      h('section.content', {}, opts.content),
      h('section.raw-content'),
      h('section.action', {}, api.message_action(msg)),
      h('footer.backlinks', {}, api.message_backlinks(msg))
    ])
    return msgEl

    function navigateToMessageOnEnter (ev) {
      // on enter (or 'o'), hit first meta.
      if(ev.keyCode == 13 || ev.keyCode == 79) {

        // unless in an input
        if (ev.target.nodeName === 'INPUT'
          || ev.target.nodeName === 'TEXTAREA') return

        // HACK! (mw)
        // there's no exported api to open a new tab. :/
        // it's only done in `app.js` module in an`onhashchange` handler.
        // sooooooo yeah this shit for now :)
        var wtf = h('a', { href: `#${msg.key}` })
        msgEl.appendChild(wtf)
        wtf.click()
        msgEl.removeChild(wtf)
      }
    }
  }

  function mini(msg, opts) {
    return h('div', {
      classList: 'Message -mini',
      attributes: {
        tabindex: '0',
        'data-key': msg.key
      }
    }, [
      h('header.author', {}, api.message_author(msg, { size: 'mini' })),
      h('section.meta', {}, api.message_meta(msg)),
      h('section.content', {}, opts.content),
      h('section.raw-content')
    ])
  }
}
