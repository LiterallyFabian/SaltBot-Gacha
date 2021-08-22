module.exports.run = async (bot, message, args) => {
    //query user searched for
    var query = args.join(' ');
    var result = utils.findCharacter(query);

    if (result.best) sendChar(message, result.best);
    else if (result.matches.length == 0) message.channel.send(`${message.author.toString()}, no character found.`)
    else message.channel.send(result.text);
}

function sendChar(message, character) {
    var characterEmbed = new Discord.MessageEmbed()
        .setColor("#a7eec9")
        .setTitle(character.name)
        .setDescription(`${character.source}\nClaim Rank: #${character.rank}`)
        .setImage(character.image)

    message.channel.send({
        embeds: [characterEmbed]
    })
}
module.exports.help = {
    name: ["infomarry", "im"],
    dm: true
}