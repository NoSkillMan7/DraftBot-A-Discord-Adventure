/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Servers = Sequelize.define('Servers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		prefix: {
			type: DataTypes.STRING(10),
			defaultValue: JsonReader.models.servers.prefix,
		},
		language: {
			type: DataTypes.STRING(2),
			defaultValue: JsonReader.models.servers.language,
		},
		discordGuild_id: {
			type: DataTypes.STRING(64),
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
	}, {
		tableName: 'servers',
		freezeTableName: true,
	});

	Servers.beforeSave((instance) => {
		instance.setDataValue('updatedAt',
			require('moment')().format('YYYY-MM-DD HH:mm:ss'));
	});

	/**
	 * @param {String} discordGuildId
	 * @return {Servers}
	 */
	Servers.getOrRegister = (discordGuildId) => {
		return Servers.findOrCreate({
			where: {
				discordGuild_id: discordGuildId,
			},
		});
	};

	return Servers;
};

