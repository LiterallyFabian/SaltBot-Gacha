module.exports.loots = {
    wishlist_slot: {
        id: "wishlist_slot",
        name: "Wishlist slot",
        plural: "Wishlist slots",
        description: "An additional slot for your character wish list.",
        weight: 15,
        max_amount: 2,
        emote: "🌠"
    },
    super_roll: {
        id: "super_roll",
        name: "Super roll",
        plural: "Super rolls",
        description: "A super roll has a 25% chance of rolling someone from your wish list.",
        weight: 50,
        min_amount: 2,
        max_amount: 5,
        emote: "🪄"
    },
    roll: {
        id: "roll",
        name: "Roll token",
        plural: "Roll tokens",
        description: "Bonus rolls to use whenever you want to.",
        weight: 200,
        min_amount: 10,
        max_amount: 25,
        emote: "🪙"
    },
    perma_roll: {
        id: "perma_roll",
        name: "Permanent roll",
        plural: "Permanent rolls",
        description: "An additional roll to spend every hour.",
        weight: 5,
        max_amount: 1,
        emote: "✨"
    },
    badge: {
        id: "badge",
        name: "Profile badge",
        plural: "Profile badges",
        description: "A permanent badge for your profile.",
        weight: 1,
        max_amount: 1,
        emote: "🛡️"
    }
};

var weighted = [].concat(...Object.values(this.loots).map((obj) => Array(Math.ceil(obj.weight)).fill(obj)));
var totalWeight = weighted.length;

module.exports.getLoot = function getLoot() {
    var boxes = 1 + Math.round(Math.random())
    var myLoot = {};
    for (var i = 0; i < boxes; i++) {
        var newItem = getItem();
        if (newItem.id in myLoot) {
            myLoot[newItem.id].amount += newItem.amount;
        } else {
            myLoot[newItem.id] = newItem.item;
            myLoot[newItem.id].amount = newItem.amount;
        }
    }
    return myLoot;
}

function getItem() {
    var item = weighted[Math.floor(Math.random() * totalWeight)];
    var min = item.min_amount ? item.min_amount : 1;
    return {
        id: item.id,
        item: item,
        amount: Math.floor(Math.random() * (item.max_amount - min)) + min
    };
}


module.exports.getUserLoot = function getUserLoot(id) {
    return new Promise(function (resolve, reject) {
        if (userCache[id].loot) resolve(userCache[id].loot);
        else
            connection.query(`SELECT id,loots,lootboxes FROM users WHERE id = ${id}`, function (err, result) {
                if (err) {
                    reject(err);
                    throw err;
                }

                var myLoot = [];
                var mappedLoot = {};
                var myLootCount = 0;
                if (result.length > 0 && result[0].loots) {
                    myLoot = JSON.parse(result[0].loots);
                    myLootCount = result[0].lootboxes;
                }

                Object.values(LootManager.loots).forEach(loot => {
                    let index = utils.findWithAttr(myLoot, "id", loot.id);
                    mappedLoot[loot.id] = index === -1 ? 0 : myLoot[index].amount;
                })

                var lootdata = {
                    map: mappedLoot,
                    loot: myLoot,
                    count: myLootCount
                }
                userCache[id].loot = lootdata;
                resolve(lootdata);
            })
    });
}