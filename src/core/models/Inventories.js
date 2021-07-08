const moment = require("moment");

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Inventories = Sequelize.define(
		"Inventories",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			lastDailyAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
			player_id: {
				type: DataTypes.INTEGER,
			},
			weapon_id: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.weapon_id,
			},
			armor_id: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.armor_id,
			},
			potion_id: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.potion_id,
			},
			object_id: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.object_id,
			},
			backup_id: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.backup_id,
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		},
		{
			tableName: "inventories",
			freezeTableName: true,
		}
	);

	/**
	 * @param {("itemID")} itemID - The itemID
	 * @param {("itemType")} itemType - The itemType to know what kind of object is updated
	 */
	Inventories.prototype.giveObject = function (itemID, itemType) {
		if (ITEMTYPE.POTION === itemType) {
			this.potion_id = itemID;
		}
		if (ITEMTYPE.WEAPON === itemType) {
			this.weapon_id = itemID;
		}
		if (ITEMTYPE.ARMOR === itemType) {
			this.armor_id = itemID;
		}
		if (ITEMTYPE.OBJECT === itemType) {
			this.backup_id = itemID;
		}
	};

	/**
	 * Generate a random item
	 * @param {number} rarityMax
	 * @param {number} itemType
	 * @returns {Item} generated item
	 */
	Inventories.prototype.generateRandomItem = async function (rarityMax = 8, itemType = null) {
		// generate a random item
		const rarity = generateRandomRarity(rarityMax);
		if (!itemType)
			itemType = generateRandomItemType();
		const query = `SELECT id
                   FROM :itemType
                   WHERE rarity = :rarity`;
		const itemsIds = await Sequelize.query(query, {
			replacements: {
				itemType: itemType,
				rarity: rarity,
			},
			type: Sequelize.QueryTypes.SELECT,
		});
		let item;
		if (ITEMTYPE.POTION === itemType) {
			item = await Potions.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id,
				},
			});
		}
		if (ITEMTYPE.WEAPON === itemType) {
			item = await Weapons.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id,
				},
			});
		}
		if (ITEMTYPE.ARMOR === itemType) {
			item = await Armors.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id,
				},
			});
		}
		if (ITEMTYPE.OBJECT === itemType) {
			item = await Objects.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id,
				},
			});
		}
		return item;
	};

	/**
	 * Generate a random potion
	 * @param {number} rarityMax
	 * @param {number} potionType
	 * @returns {Potions} generated potion
	 */
	Inventories.prototype.generateRandomPotion = async function (potionType = null, rarityMax = 8) {
		if (!potionType) return this.generateRandomItem(rarityMax, ITEMTYPE.POTION);
		// generate a random potion
		const rarity = generateRandomRarity(rarityMax);
		return Potions.findOne({
			where: {
				nature: potionType,
				rarity: rarity,
			},
			order: Sequelize.random()
		});
	};

	/**
	 * Generate a random potion
	 * @param {number} rarityMax
	 * @param {number} objectType
	 * @returns {Potions} generated potion
	 */
	Inventories.prototype.generateRandomObject = async function (objectType = null, rarityMax = 8) {
		if (!objectType) return this.generateRandomItem(rarityMax, ITEMTYPE.POTION);
		// generate a random potion
		const rarity = generateRandomRarity(rarityMax);
		return Objects.findOne({
			where: {
				nature: objectType,
				rarity: rarity,
			},
			order: Sequelize.random()
		});
	};

	Inventories.beforeSave((instance) => {
		instance.setDataValue("updatedAt", moment().format("YYYY-MM-DD HH:mm:ss"));
	});

	Inventories.prototype.updateLastDailyAt = function () {
		this.lastDailyAt = new moment();
	};

	Inventories.prototype.drinkPotion = function () {
		this.potion_id = JsonReader.models.inventories.potion_id;
	};

	/**
	 * @param {("fr"|"en")} language - The language the inventory has to be displayed in
	 */
	Inventories.prototype.toEmbedObject = async function (language) {
		return [
			await (await this.getWeapon()).toFieldObject(language),
			await (await this.getArmor()).toFieldObject(language),
			await (await this.getPotion()).toFieldObject(language),
			await (await this.getActiveObject()).toFieldObject(language, "active"),
			await (await this.getBackupObject()).toFieldObject(language, "backup"),
		];
	};

	/**
	 * check if inventory contains item to sell
	 * @return {boolean}
	 */
	Inventories.prototype.hasItemToSell = function () {
		return this.backup_id !== JsonReader.models.inventories.backup_id;
	};

	/**
	 * edit daily cooldown
	 * @param {number} hours
	 */
	Inventories.prototype.editDailyCooldown = function (hours) {
		this.lastDailyAt = new moment(this.lastDailyAt).add(hours, "h");
	};

	return Inventories;
};
