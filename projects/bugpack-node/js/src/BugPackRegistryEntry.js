//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var path = require('path');

var BugPackSource = require('./BugPackSource');
var PathUtil = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryEntry = function(registryPath, registryEntryJson) {
    this.validate(registryEntryJson);

    /**
     * @private
     * @type {boolean}
     */
    this.autoload           = registryEntryJson.autoload;

    /**
     * @private
     * @type {string}
     */
    this.path               = registryEntryJson.path;

    /**
     * @private
     * @type {string}
     */
    this.registryPath       = registryPath;

    /**
     * @private
     * @type {string}
     */
    this.sourceFilePath     = path.join(registryPath, this.path);

    /**
     * @private
     * @type {BugPackSource}
     */
    this.bugPackSource      = new BugPackSource(this.sourceFilePath);

    /**
     * @private
     * @type {Array.<string>}
     */
    this.exports            = registryEntryJson.exports || [];

    /**
     * @private
     * @type {Array.<string>}
     */
    this.requires           = registryEntryJson.requires || [];
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {boolean}
 */
BugPackRegistryEntry.prototype.getAutoload = function() {
    return this.autoload;
};

/**
 * @return {string}
 */
BugPackRegistryEntry.prototype.getBugPackSource = function() {
    return this.bugPackSource;
};

/**
 * @return {string}
 */
BugPackRegistryEntry.prototype.getRegistryPath = function() {
    return this.registryPath;
};

/**
 * @return {string}
 */
BugPackRegistryEntry.prototype.getSourceFilePath = function() {
    return this.sourceFilePath;
};

/**
 * @return {Array.<string>}
 */
BugPackRegistryEntry.prototype.getExports = function() {
    return this.exports;
};

/**
 * @return {Array.<string>}
 */
BugPackRegistryEntry.prototype.getRequires = function() {
    return this.requires;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {Object} registryEntryJson
 */
BugPackRegistryEntry.prototype.validate = function(registryEntryJson) {
    if (!registryEntryJson.path) {
        throw new Error("Path is required for registry entries. " + JSON.stringify(registryEntryJson));
    }

    //TODO BRN: Validate the package name using regex
    //TODO BRN: Validate the export names using regex
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistryEntry;
