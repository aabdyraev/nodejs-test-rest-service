const TokenService = require('../../lib/services/TokenService')
const User = require('../../lib/models/User')

module.exports = async (req, resp, next) => {
  const {secret, header_name: headerName} = req.app.get('config.security').auth

  if (!req.get(headerName)) {
    return resp.status(401).send('Unauthorized action')
  }

  const token = req.get(headerName)
  const data = TokenService.decodeToken(token, secret)

  if (!data) {
    return resp.status(401).send('Unauthorized action')
  }

  const {data: {id: primaryId}} = data
  const user = await User.findByPk(primaryId)

  if (!user) {
    return resp.status(401).send('Unauthorized action')
  }

  if (token !== user.get('accessToken')) {
    return resp.status(401).send('Unauthorized action')
  }

  return next()
}
