const Express = require('express')
const {Op} = require('sequelize')
const DayJS = require('dayjs')
const {Crypt} = require('unpc')
const {BCryptHashingAdapter} = require('unpc/bcrypt')

const TokenService = require('../../lib/services/TokenService')
const {validationMiddleware} = require('../../lib/services/ValidationService')
const checkTokenMiddleware = require('./tokenCheckMiddleware')

const User = require('../../lib/models/User')

const route = Express()

const CryptMech = new Crypt({
	default: "bcrypt",
	adapters: [BCryptHashingAdapter],
	options: { encoding: "hex" }
})

route.post('/signup', validationMiddleware({
	post: {
			id: ['required', 'email|phone'], 
			password: ['required']
		}
	}), async (req, resp) => {
	try {
		const {
			secret, 
			expiration_interval: expirationTime, 
			refresh_secret: refreshSecret
		} = req.app.get('config.security').auth
		const {id, password} = req.body

		const find = await User.findOne({
			where: {
				id: {[Op.eq]: id}
			}
		})

		if (find) {
			throw new URIError('Ошибка авторизации: указанное имя пользователя занято')
		}

		const passwordHash = await CryptMech.hash(password + secret)
		const user = await User.create({id, passwordHash})

    const expirationTimestamp = DayJS().add(Number(expirationTime), 's').unix()
		const userData = {
			id: user.get('id'),
			expiresIn: expirationTimestamp
		}
    const accessToken = TokenService.initToken(
			userData,
      secret,
			Number(expirationTime)
    )
    const refreshToken = TokenService.initToken(
      {...userData, token: accessToken},
      refreshSecret,
      Number(expirationTime)
    )

		const [affectedRowCount, ] = await User.update(
			{accessToken, refreshToken}, 
			{
				where: {
					id: {[Op.eq]: user.get('id')}
				}
			}
		)

		if (!affectedRowCount) {
			throw new Error('Ошибка сессии')
		}

		return resp.json({
			...userData,
			token: accessToken,
      refreshToken
		})
	} catch(err) {
		return resp.status(err instanceof URIError ? 403 : 500).send(err.message)
	}
})

route.get('/logout', checkTokenMiddleware, async (req, resp) => {
  try {
		const {
			secret, 
			header_name: headerName
		} = req.app.get('config.security').auth

		const {data: {id}} = TokenService.decodeToken(req.get(headerName), secret)

		const [affectedRowCount, ] = await User.update(
			{
				accessToken: null, 
				refreshToken: null
			}, 
			{
				where: {
					id: {[Op.eq]: id}
				}
			}
		)

		if (!affectedRowCount) {
			throw new URIError('Ошибка сессии')
		}

    return resp.status(200).send('Ok')
  } catch(err) {
    return resp.status(err instanceof URIError ? 401 : 500).send(err.message)
  }
})

route.get('/info', checkTokenMiddleware, async (req, resp) => {
  try {
		const {
			secret, 
			header_name: headerName
		} = req.app.get('config.security').auth

		const {data: {id}} = TokenService.decodeToken(req.get(headerName), secret)

    return resp.status(200).json({id})
  } catch(err) {
    return resp.status(err instanceof URIError ? 401 : 500).send(err.message)
  }
})

module.exports = route