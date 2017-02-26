const { join } = require('path')
const docs = require('depdocs')
const { writeFile } = require('fs')

docs([
  join(__dirname, './!(index|docs).js'),
  join(__dirname, './!(node_modules|example)/**/*.js')
], function (err, apiDocs) {
  if (err) throw err

  const apiDocsPath = join(__dirname, 'api.md')
  writeFile(apiDocsPath, apiDocs, function (err) {
    if (err) throw err
  })
})
