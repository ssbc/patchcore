
# blob

## `blob.async.addFiles (files, opts, cb)`

wraps [blobFiles(files, server, opts cb)](https://github.com/ssbc/ssb-blob-files#blobfilesfiles-server-opts-cb) method on `ssb-blob-files`

## `blob.html.input (onAdded, opts)`

returns a html file input, and calls back to `onAdded` when a file is selected by the user.

## `blob.obs.has(blob_id)`

return an observable that resolves to true when the local sbot has the `blob_id`

## `blob.sync.url(id)`

no-op, just returns the id.

