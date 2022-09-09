const JWT = require('jsonwebtoken')

const decodeToken = (token, secret) => {
  try {
    if (!JWT.verify(token, secret)) {
      return null
    }
  
    return JWT.decode(token)
  } catch (err) {
    return null
  }
}

const initToken = (data, secret, expirationTime = 0) => {
  return JWT.sign(
    {data},
    secret,
    {expiresIn: Number(expirationTime)}
  )
}

const decodeTokenMiddleware = (container) => (req, resp, next) => {
  const {secret, header_name, headerName} = container

  if (!req.get[header_name || headerName]) {
    return resp.status(401).send('Unauthorized action')
  }

  const token = req.get[header_name || headerName]
  const data = decodeToken(token, secret)

  if (!data) {
    return resp.status(401).send('Unauthorized action')
  }

  next()
}

module.exports = {
  decodeToken,
  initToken,
  decodeTokenMiddleware
}