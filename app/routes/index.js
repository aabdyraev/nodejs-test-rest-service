const Express = require('express')

const app = Express()

app.use('/signin', require('./Auth'))
app.use('/file', require('./File'))
app.use('/', require('./User'))

module.exports = app