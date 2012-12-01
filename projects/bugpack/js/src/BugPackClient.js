//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPack = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

/**
 * @private
 * @type {Object}
 */
BugPack.loadedPacks = {};

/**
 * @private
 * @type {Object}
 */
BugPack.registeredPacks = null;


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} packName
 * @param {Object} options
 */
BugPack.declare = function(packName, options) {
    // NOTE BRN: This function doesn't need to do anything for client side code
};

BugPack.export = function(pack) {
    //TODO BRN: Figure out how to get packName from the stack declared in declare()
    BugPack.loadedPacks[packName] = pack;
};

/**
 * @param {function()} callback
 */
BugPack.loadAllPacks = function(callback) {
    BugPack.loadRegistry(function() {
        var packageCount = 0;
        var loadedCount = 0;
        for (var packName in BugPack.registeredPacks) {
            packageCount++;
            BugPack.loadPack(packName, function() {
                loadedCount++;
                if (loadedCount === packageCount) {
                    callback();
                }
            });
        }
    });
};

/**
 * @param {string} packName
 * @return {*}
 */
BugPack.require = function(packName) {
    if (!BugPack.hasPackLoaded(packName)) {

        // NOTE BRN: We put this check within the hasPackLoaded check. This way files that are concatenated together can
        // retrieve classes without ever retrieving the registry. This is primarily require for client side files.

        if (BugPack.registeredPacks === null) {

        }

    }
    return BugPack.loadedPacks[packName];
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @return {string}
 */
BugPack.discoverRegistry = function() {

};

/**
 * @private
 * @param {string} packName
 * @return {boolean}
 */
BugPack.hasPackLoaded = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.loadedPacks, packName);
};

/**
 * @private
 * @param {string} packName
 * @return {boolean}
 */
BugPack.hashPackRegistered = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.registeredPacks, packName);
};

/**
 * @private
 * @param {string} packName
 * @param {function()} callback
 */
BugPack.loadPack = function(packName, callback) {

};

/**
 * @private
 * @param {string} packName
 */
BugPack.loadPackSync = function(packName) {

};

/**
 * @private
 * @param {function()} callback
 */
BugPack.loadRegistry = function(callback) {
    //TODO BRN:
};

/**
 * @private
 */
BugPack.loadRegistrySync = function() {

};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPack;
