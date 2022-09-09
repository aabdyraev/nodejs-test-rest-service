const DataTypes = require('sequelize').DataTypes
const GeneralModel = require('../services/DatabaseModelService')

module.exports = GeneralModel.define(
	'File',
	{
		id: {
			type: DataTypes.MEDIUMINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		ext: {
			type: DataTypes.STRING(8),
			allowNull: false
		},
		mimeType: {
			type: DataTypes.STRING(64),
			allowNull: false,
			field: 'mime_type'
		},
		size: {
			type: DataTypes.MEDIUMINT,
			allowNull: false
		},
		registrationDate: {
			type: DataTypes.DATE,
			allowNull: false,
			field: 'registration_date',
			defaultValue: DataTypes.NOW
		}
	},
	{
		tableName: 'files',
		timestamps: false
	}
);