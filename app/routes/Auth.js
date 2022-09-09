const Express = require('express')
const {Op} = require('sequelize')
const DayJS = require('dayjs')
const {Crypt} = require('unpc')
const {BCryptHashingAdapter} = require('unpc/bcrypt')

const TokenService = require('../../lib/services/TokenService')
const {validationMiddleware} = require('../../lib/services/ValidationService')

const User = require('../../lib/models/User')

const CryptMech = new Crypt({
	default: "bcrypt",
	adapters: [BCryptHashingAdapter],
	options: { encoding: "hex" }
})

const route = Express()

route.post('/', validationMiddleware({
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
	
		const user = await User.findOne({
			where: {
				id: {[Op.eq]: id}
			}
		})

		if (!user) {
			throw new Error('Ошибка авторизации: неверно задано имя пользователя')
		}

		const isCorrect = await CryptMech.verify(user.get('passwordHash'), password + secret)
		
		if (!isCorrect) {
			throw new Error('Ошибка авторизации: неверно указан пароль')
		}

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
		return resp.status(500).send(err.message)
	}
})

route.post('/new_token', async (req, resp) => {
  try {
		const {
			secret, 
			expiration_interval: expirationTime, 
			refresh_secret: refreshSecret, 
			header_name: headerName
		} = req.app.get('config.security').auth
		
    const reqRefreshToken = req.get(headerName)
		const decodedData = TokenService.decodeToken(reqRefreshToken, refreshSecret)

		if (!decodedData) {
			throw new URIError('Ошибка аутентикации: неверный запрос')
		}
	
		const {data: {id, token}} = decodedData
	
		if (!TokenService.decodeToken(token, secret)) {
			throw new URIError('Ошибка аутентикации: неверные параметры запроса')
		}

    const user = await User.findOne({
      where: {
        id: {[Op.eq]: id}
      }
    })

    if (!user || user.get('refreshToken') !== reqRefreshToken) {
      throw new URIError('Ошибка аутентикации: неверные параметры запроса')
    }

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
    return resp.status(err instanceof URIError ? 401 : 500).send(err.message)
  }
})

module.exports = route