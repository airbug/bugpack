//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPack = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

BugPack.loadedPacks = {};

BugPack.registry = {};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

BugPack.declare = function(packName) {

};

BugPack.export = function(packName, pack) {
    BugPack.packs[packName] = pack;
};

BugPack.hasPack = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.packs, packName);
};

BugPack.lookupPack = function(packName) {

    throw new Error("Unknown bug pack '" + packName + "'");
};

BugPack.require = function(packName) {
    if (BugPack.hasPack(packName)) {
        return BugPack.packs[packName];
    } else {
        BugPack.lookupPack(packName);
    }
};
