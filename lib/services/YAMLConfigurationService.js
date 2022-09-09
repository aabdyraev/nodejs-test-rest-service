const path = require('path')
const {readFileSync} = require('fs')
const {load} = require('js-yaml')

const DEFAULT_CONFIG_PATH = path.join(
	__dirname,
	'..',
	'..',
	'app',
	'config',
	(process.env.NODE_ENV == 'production' ? 'production' : 'development')
)

const getConfig = (filePath) => load(readFileSync(filePath))

module.exports = {
	getConfig,
	DEFAULT_CONFIG_PATH
}