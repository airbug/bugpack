//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryFile = function(registryFilePath) {

    /**
     * @private
     * @type {string}
     */
    this.registryFilePath = registryFilePath;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackRegistryFile.prototype.getRegistryPath = function() {
    return path.dirname(this.registryFilePath);
};

/**
 *
 */
BugPackRegistryFile.prototype.loadRegistryContents = function() {
    return JSON.parse(fs.readFileSync(this.registryFilePath, "utf8"));
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistryFile;
