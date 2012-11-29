//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');

var RegistryBuilder = require('./RegistryBuilder');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPack = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

BugPack.loadedPacks = {};

BugPack.registry = null;

BugPack.registryBuilding = false;


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

BugPack.buildRegistry = function(sourceRoot, callback) {
    var registryBuilder = new RegistryBuilder();
    registryBuilder.build(sourceRoot, callback);
};

BugPack.declare = function(packName, options) {
    if (BugPack.registryBuilding) {
        process.send({
            packName: packName,
            options: options
        });
        process.exit();
    }
};

BugPack.export = function(packName, pack) {
    BugPack.loadedPacks[packName] = pack;
};

BugPack.hasPackLoaded = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.loadedPacks, packName);
};

BugPack.loadPack = function(packName) {
    if (BugPack.registry === null) {
        BugPack.loadRegistry();
    }
    throw new Error("Unknown bug pack '" + packName + "'");
};

BugPack.loadRegistry = function() {
    //TODO BRN: Try using "require.main.filename" to find the root of the module. Also try "module.filename"
    // If neither of these work, use a similar search pattern as the node js module system. search backwards until the
    // first "node_modules" dir is found.

    //TODO BRN: Load the bugpack-registry.json file which should be located at the root of the module dir /bugpack-registry.json
};

BugPack.require = function(packName) {
    if (BugPack.hasPackLoaded(packName)) {
        return BugPack.loadedPacks[packName];
    } else {
        BugPack.loadPack(packName);
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPack;
