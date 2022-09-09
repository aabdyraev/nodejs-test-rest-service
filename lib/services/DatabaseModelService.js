const path = require('path')
const Sequelize = require('sequelize')
const ConfigurationService = require('./YAMLConfigurationService')

const {
	adapter,
	host,
	port,
	username,
	password,
	database
} = ConfigurationService.getConfig(
	path.join(ConfigurationService.DEFAULT_CONFIG_PATH, 'database.yml')
)

const defaultOptions = {
	dialect: adapter,
	pool: {
		max: 10,
		min: 1,
		idle: 30000,
		evict: 30000,
		acquire: 30000
	}
}

const DatabaseModelService = new Sequelize(database, username, password, {
	host,
	port,
	...defaultOptions
});

module.exports = DatabaseModelService