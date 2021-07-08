const BADGE = "💞";
const doNothing = require('./doNothingSmallEvent');

/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	if (!entity.Player.Pet) {
		//the player does not have a pet : do nothing
		return await doNothing.executeSmallEvent(message, language, entity, seEmbed);
	}

	const pet = entity.Player.Pet;
	let interaction = pickRandomInteraction(entity.Player.Pet);
	let amount = 0;
	let food = null;
	switch (interaction) {
		case "money":
			amount = randInt(20, 70);
			entity.Player.money += amount;
			await entity.Player.save();
			break;
		case "gainLife":
			amount = randInt(1, 5);
			await entity.addHealth(amount);
			await entity.save();
			break;
		case "gainLove":
			amount = randInt(1, 3);
			pet.lovePoints += amount;
			if (pet.lovePoints > PETS.MAX_LOVE_POINTS) {
				pet.lovePoints = PETS.MAX_LOVE_POINTS;
			}
			await pet.save();
			break;
		case "food":
			if (entity.Player.guild_id) {
				food = draftbotRandom.pick([JsonReader.food.commonFood, JsonReader.food.herbivorousFood, JsonReader.food.carnivorousFood, JsonReader.food.ultimateFood]);
			} else {
				interaction = "nothing";
			}
			break;
		case "gainTime":
			amount = randInt(5, 20);
			require("../Maps").advanceTime(entity.Player, amount);
			entity.Player.save();
			break;
		case "points":
			amount = randInt(20, 70);
			entity.Player.score += amount;
			await entity.Player.save();
			break;
		case "badge":
			if (entity.Player.badges !== null) {
				if (entity.Player.badges.includes(BADGE)) {
					interaction = "nothing";
				} else {
					entity.Player.addBadge(BADGE);
					entity.Player.save();
				}
			} else {
				entity.Player.addBadge(BADGE);
				entity.Player.save();
			}

			break;
		case "loseLife":
			amount = randInt(1, 5);
			await entity.addHealth(-amount);
			await entity.save();
			break;
		case "loseMoney":
			amount = randInt(20, 70);
			entity.Player.money -= amount;
			entity.Player.save();
			break;
		case "loseTime":
			amount = randInt(5, 20);
			await require("../Maps").applyEffect(entity.Player, EFFECT.OCCUPIED, amount);
			entity.Player.save();
			break;
		case "petFlee":
			pet.destroy();
			entity.Player.pet_id = null;
			entity.Player.save();
			break;
		case "loseLove":
			amount = randInt(1, 3);
			pet.lovePoints -= amount;
			if (pet.lovePoints < 0) {
				pet.lovePoints = 0;
			}
			await pet.save();
			break;
	}
	await generatePetEmbed(language, interaction, seEmbed, pet, amount, food);

	await message.channel.send(seEmbed);
	switch (interaction) {
		case "item":
			await giveRandomItem(message.author, message.channel, language, entity);
			break;
		case "food":
			await require("../../commands/guild/GuildShopCommand").giveFood(message, language, entity, message.author, food, 1);
			break;
		case "loseLife":
			await entity.Player.killIfNeeded(entity, message.channel, language);
			break;
	}
	log(entity.discordUser_id + " got a pet interaction");
};

/**
 * Allow to generate the embed that will be displayed to the player
 * @param language
 * @param interaction
 * @param seEmbed - base small event embed
 * @param pet - The pet of the player
 * @param amount - amount of stuff gained
 * @param food - food earned
 * @returns {Promise<void>}
 */
const generatePetEmbed = async function(language, interaction, seEmbed, pet, amount, food) {
	const tr = JsonReader.small_events.pet.getTranslation(language);
	const sentence = tr[interaction][randInt(0, tr[interaction].length)];
	const random_animal = sentence.includes("{random_animal}") ? await PetEntities.generateRandomPetEntityNotGuild() : null;
	seEmbed.setDescription(format(sentence, {
		pet: PetEntities.getPetEmote(pet) + " " + (pet.nickname ? pet.nickname : PetEntities.getPetTypeName(pet, language)),
		nominative: tr.nominative[pet.sex],
		nominativeShift: tr.nominative[pet.sex].charAt(0).toUpperCase() + tr.nominative[pet.sex].slice(1),
		accusative: tr.accusative[pet.sex],
		accusativeShift: tr.accusative[pet.sex].charAt(0).toUpperCase() + tr.accusative[pet.sex].slice(1),
		determinant: tr.determinant[pet.sex],
		determinantShift: tr.determinant[pet.sex].charAt(0).toUpperCase() + tr.determinant[pet.sex].slice(1),
		amount: amount,
		food: food ? food.translations[language].name.toLowerCase() + " " + food.emote + " " : "",
		badge: BADGE,
		feminine: pet.sex === "f" ? "e" : "",
		random_animal: random_animal ? (PetEntities.getPetEmote(random_animal) + " " + PetEntities.getPetTypeName(random_animal, language)) : "",
		random_animal_feminine: random_animal ? (random_animal.sex === "f" ? "e" : "") : ""
	}));
};

/**
 * Sélectionne une interaction aléatoire avec un pet
 * @param pet_entity - le pet
 * @returns {string|null} - une interaction aléatoire
 */
const pickRandomInteraction = function (pet_entity) {
	const section = pet_entity.lovePoints <= PETS.LOVE_LEVELS[0] ? JsonReader.small_events.pet.rarities.feisty : JsonReader.small_events.pet.rarities.normal;
	const level = pet_entity.PetModel.rarity + (PetEntities.getLoveLevelNumber(pet_entity) === 5 ? 1 : 0);

	let total = 0;
	for (let key in section) {
		if (section.hasOwnProperty(key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					total += section[key].probabilityWeight;
				}
			} else {
				total += section[key].probabilityWeight;
			}
		}
	}

	const pickedNumber = randInt(0, total);
	let cumulative = 0;

	for (let key in section) {
		if (section.hasOwnProperty(key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					if (pickedNumber < cumulative + section[key].probabilityWeight) {
						return key;
					}
					cumulative += section[key].probabilityWeight;
				}
			} else if (pickedNumber < cumulative + section[key].probabilityWeight) {
				return key;
			} else {
				cumulative += section[key].probabilityWeight;
			}
		}
	}
	return null;
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};