//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var BugPackKey              = require('./BugPackKey');
var BugPackRegistryEntry    = require('./BugPackRegistryEntry');
var BugPackSource           = require('./BugPackSource');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistry = function() {

    /**
     * @private
     * @type {Object}
     */
    this.registryKeyToRegistryEntryMap = {};

    /**
     * @private
     * @type {Array.<BugPackRegistryEntry>}
     */
    this.registryEntries = [];

    /**
     * @private
     * @type {Object}
     */
    this.sourceFilePathToRegistryEntryMap = {};
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {Array.<BugPackRegistryEntry>}
 */
BugPackRegistry.prototype.getRegistryEntries = function() {
    return this.registryEntries;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {Array.<BugPackRegistryFile>} registryFiles
 */
BugPackRegistry.prototype.generate = function(registryFiles) {
    var _this = this;
    registryFiles.forEach(function(registryFile) {
        var registryEntryJsons = registryFile.loadRegistryContents();
        var registryPath = registryFile.getRegistryPath();
        for (var key in registryEntryJsons) {
            var registryEntry = new BugPackRegistryEntry(registryPath, registryEntryJsons[key]);
            var exports = registryEntry.getExports();
            var sourceFilePath = registryEntry.getSourceFilePath();

            if (_this.hasEntryForSourceFilePath(sourceFilePath)) {
                throw new Error("The source file path '" + sourceFilePath + "' has already been registered");
            }

            _this.registryEntries.push(registryEntry);
            _this.sourceFilePathToRegistryEntryMap[sourceFilePath] = registryEntry;

            // NOTE BRN: export names are not required for exports. This can be useful when annotating files that are
            // loaded more like scripts.

            if (exports) {
                exports.forEach(function(exportKey) {
                    var bugPackKey = this.generateBugPackKey(exportKey);
                    _this.mapExportName(bugPackKey.getPackageName(), bugPackKey.getExportName(), registryEntry);
                });
            }
        }
    });
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {boolean}
 */
BugPackRegistry.prototype.hasEntryForExport = function(packageName, exportName) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    return Object.prototype.hasOwnProperty.call(this.registryKeyToRegistryEntryMap, registryKey);
};

/**
 * @param {string} sourceFilePath
 * @return {boolean}
 */
BugPackRegistry.prototype.hasEntryForSourceFilePath = function(sourceFilePath) {
    return Object.prototype.hasOwnProperty.call(this.sourceFilePathToRegistryEntryMap, sourceFilePath);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {BugPackRegistryEntry}
 */
BugPackRegistry.prototype.getEntryByPackageAndExport = function(packageName, exportName) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    if (Object.prototype.hasOwnProperty.call(this.registryKeyToRegistryEntryMap, registryKey)) {
        return this.registryKeyToRegistryEntryMap[registryKey];
    }
    return null;
};

/**
 * @param {string} sourceFilePath
 * @return {BugPackRegistryEntry}
 */
BugPackRegistry.prototype.getEntryBySourceFilePath = function(sourceFilePath) {
    if (this.hasEntryForSourceFilePath(sourceFilePath)) {
        return this.sourceFilePathToRegistryEntryMap[sourceFilePath];
    }
    return null;
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {string} bugPackKeyString
 * @return {BugPackKey}
 */
BugPackRegistry.prototype.generateBugPackKey = function(bugPackKeyString) {
    return new BugPackKey(bugPackKeyString);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {string}
 */
BugPackRegistry.prototype.generateRegistryKey = function(packageName, exportName) {
    return packageName + "+" + exportName;
};

/**
 * @private
 * @param {string} packageName
 * @param {string} exportName
 * @param {BugPackRegistryEntry} bugPackRegistryEntry
 */
BugPackRegistry.prototype.mapExportName = function(packageName, exportName, bugPackRegistryEntry) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    if (this.hasEntryForExport(packageName, exportName)) {
        throw new Error("Package '" + packageName + "' already has a registry entry registered for export '" +
            exportName + "'");
    }
    this.registryKeyToRegistryEntryMap[registryKey] = bugPackRegistryEntry;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistry;
