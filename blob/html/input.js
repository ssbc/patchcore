const nest = require('depnest')
const h = require('mutant/h')

module.exports = {
  gives: nest('blob.html.input', true),
  needs: nest({
    'blob.async.addFiles': 'first',
    'sbot.obs.connection': 'first'
  }),
  create: function (api) {
    return nest('blob.html.input', FileInput)

    function FileInput (onAdded, opts = {}) {
      const { accept, private: isPrivate, removeExif: stripExif, resize, quality } = opts

      return h('input', {
        type: 'file',
        accept,
        attributes: { multiple: true },
        'ev-change': handleEvent
      })

      function handleEvent (ev) {
        const opts = { isPrivate, stripExif, resize, quality }
        api.blob.async.addFiles(ev.target.files, api.sbot.obs.connection, opts, (err, result) => {
          if (err) {
            console.error(err)
            // NOTE this is not ideal but the current signature of onAdded sucks...
            onAdded({
              link: null,
              name: err.message,
              size: 9e9, // just signal too big for anyone checking
              type: null,
              error: err
            })
          } else {
            onAdded(result) // { link, name, size, type }
          }
          ev.target.value = ''
        })
      }
    }
  }
}
