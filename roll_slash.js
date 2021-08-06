module.exports.execute = async (interaction) => {
    var id = interaction.member.id.toString();
    var date = new Date();
    var thisInterval = `${date.getDay()}-${date.getHours()}`;

    //user exists in cache
    if (gacha.userCache[id]) {
        //reset rolls if user haven't rolled this hour
        if (gacha.userCache[id].lastInterval != thisInterval) gacha.userCache[id].rolls = config.counts.rollsPerHour;

        //user got rolls in stock
        if (gacha.userCache[id].rolls > 0) {
            gacha.userCache[id].rolls--;
            gacha.userCache[id].lastInterval = thisInterval;
            var character = utils.generateCharacter(interaction.member);
            roll(interaction, gacha.userCache[id].rolls, character);
        } else {
            var minutesLeft = 60 - date.getMinutes();
            interaction.reply(`You're out of rolls ${interaction.member}! Your rolls will reset in **${minutesLeft} ${minutesLeft == 1 ? "minute" : "minutes"}**.`)
        }
        //user does not exist in cache
    } else {
        gacha.userCache[id] = {
            rolls: 9,
            lastInterval: thisInterval
        }
        var character = utils.generateCharacter(interaction.member);
        roll(interaction, gacha.userCache[id].rolls, character);
    }
}

var roll = function (interaction, left, character) {
    var characterEmbed = new Discord.MessageEmbed()
        .setColor("GOLD")
        .setTitle(character.name)
        .setDescription(character.source)
        .setImage(character.image)
        .setFooter("React to claim! " + left)

    var claimButton = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
            .setCustomId(`claimCharacter-${interaction.id}`)
            .setLabel('Claim')
            .setStyle('PRIMARY'),
        );
    interaction.reply({
        embeds: [characterEmbed],
        components: [claimButton]
    })

    gacha.messageInfo[interaction.id] = {
        type: "roll",
        id: character.id,
        claimed: false
    };
}
module.exports.roll = roll;

//Processes a claim reaction; checks if anyone was quicker, checks if claim is up etc
module.exports.processClaim = function processClaim(interaction, id) {
    var embed = interaction.message.embeds[0];
    var user = interaction.member;

    var claimedId = gacha.messageInfo[id].id;
    var claimedName = embed.title;
    if (!gacha.messageInfo[id].claimed) {

        connection.query(`SELECT hasClaimed,characters FROM users WHERE id = '${user.id}'`, function (err, result) {
            if (err) throw err;
            else {
                //user is NEW
                if (result.length == 0) tryClaim(user, claimedId, "[]", interaction, id);
                //user have not claimed yet
                else if (result[0].hasClaimed == 0) tryClaim(user, claimedId, result[0].characters, interaction, id);
                //user have claimed
                else interaction.reply(`${user.toString()}, you have already claimed someone this hour!`)
            }
        });
    }
}

//Tries to actually claim a character after verifying in processClaim() that user got claim 
function tryClaim(user, characterID, myCharacters, interaction, id) {
    if (!gacha.messageInfo[id].claimed) {
        var embed = interaction.message.embeds[0];
        var characterName = embed.title;
        var user = interaction.member.user;

        gacha.messageInfo[id].claimed = true;

        interaction.channel.send(`**${user.username}** claimed **${characterName}:heart_exclamation:**`);


        var charArray = JSON.parse(myCharacters);
        var updated = false;

        //try to update existing entry
        for (var i = 0; i < charArray.length; i++) {
            if (charArray[i].id == characterID) {
                charArray[i].amount++;
                updated = true;
                break;
            }
        }

        //add new entry
        if (!updated) {
            charArray.push({
                "amount": 1,
                "id": characterID,
            })
        }

        var query = `
        INSERT INTO users (id, username, characters, hasClaimed, totalCharacters, uniqueCharacters)
        VALUES (${user.id}, ${connection.escape(user.username)}, ${connection.escape(JSON.stringify(charArray))}, 1, 1, 1) 
        ON DUPLICATE KEY UPDATE 
        username = ${connection.escape(user.username)}, 
        characters = ${connection.escape(JSON.stringify(charArray))}, 
        hasClaimed = 1, 
        totalCharacters = totalCharacters + 1, 
        uniqueCharacters = uniqueCharacters + ${updated ? 0 : 1};`;

        connection.query(query, function (err, result) {
            if (err) throw err;
            else {
                console.log(`${user.username} claimed ${characterName} (ID ${characterID})`)
                var newEmbed = new Discord.MessageEmbed()
                    .setColor("#3D0000")
                    .setTitle(embed.title)
                    .setDescription(embed.description)
                    .setImage(embed.image.url)
                    .setFooter(`Belongs to ${user.username}`, `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=128`)

                interaction.update({
                    embeds: [newEmbed],
                    components: []
                })
            }
        });

        //add claim to character
        connection.query(`UPDATE characters SET claims = claims + 1 WHERE id = ${characterID};`, function (err, result) {
            if (err) throw err;
        });
    }
}


module.exports.help = {
    slash: true,
    name: ["roll", "r", "ma", "m", "wa", "w", "ha", "h"],
    description: "Roll a random character.",
    dm: false
}