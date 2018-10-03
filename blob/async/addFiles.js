const nest = require('depnest')
const blobFiles = require('ssb-blob-files')

exports.gives = nest('blob.async.addFiles', true)

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest({
    'blob.async.addFiles': blobFiles
  })
}
