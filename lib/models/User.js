const DataTypes = require('sequelize').DataTypes
const GeneralModel = require('../services/DatabaseModelService')

module.exports = GeneralModel.define(
	'User',
	{
		id: {
			type: DataTypes.STRING(255),
			allowNull: false,
			primaryKey: true
		},
		passwordHash: {
			type: DataTypes.STRING(255),
			allowNull: false,
			field: 'passwd_hash',
			defaultValue: ''
		},
		accessToken: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'access_token'
		},
		refreshToken: {
			type: DataTypes.TEXT,
			allowNull: true,
			field: 'refresh_token'
		}
	},
	{
		tableName: 'users',
		timestamps: false
	}
);