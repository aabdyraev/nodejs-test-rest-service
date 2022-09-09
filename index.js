const path = require('path')
//const ejs = require('ejs')
const Express = require('express')
const access = require('access-control')
const helmet = require('helmet')
const logger = require('morgan')

const ConfigurationService = require('./lib/services/YAMLConfigurationService')

const config = ConfigurationService.getConfig(
  path.join(ConfigurationService.DEFAULT_CONFIG_PATH, 'general.yml')
)

const securityConfig = ConfigurationService.getConfig(
  path.join(ConfigurationService.DEFAULT_CONFIG_PATH, 'security.yml')
)

const cors = access({
	origins: '*',
	methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
	credentials: false,
	headers: `Accept,Cache-Control,Content-Type,${securityConfig.auth.header_name}`,
	exposed: 'Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Max-Age, Access-Control-Allow-Credentials'
})

const app = Express()
const routes = require('./app/routes')

app.set('views', path.join(__dirname, 'app', 'views'))
app.set('view engine', 'ejs')
app.set('config.general', config)
app.set('config.security', securityConfig)
app.use(Express.static(path.join(__dirname, '..', 'public')))
app.use(helmet({frameguard: false}))
app.use(logger('tiny'))
app.use(Express.urlencoded({extended: false}))
app.use(cors)
app.use(routes)

app.use((req, resp, next) => resp.render('index'))

// catch 404
app.use((req, resp, next) => {
	return resp.render('404', {url: req.url})
})

// error handler
app.use((err, req, resp, next) => {
	// set locals, only providing error in development
	resp.locals.message = err.message
	resp.locals.error = req.app.get('env') === 'development' ? err : {}
	//console.log(res.locals, err)
	// render the error page
	return resp.status(500).render('500', {code: err.message})
})

module.exports = app

