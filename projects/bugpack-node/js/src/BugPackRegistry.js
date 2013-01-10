//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var BugPackPackage = require('./BugPackPackage');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistry = function() {

    /**
     * @private
     * @type {Object}
     */
    this.packages = {};

    /**
     * @private
     * @type {Object}
     */
    this.registryKeyToBugPackSourceMap = {};
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} packageName
 */
BugPackRegistry.prototype.createPackage = function(packageName) {
    var bugPackPackage = new BugPackPackage(packageName);
    this.packages[bugPackPackage.getName()] = bugPackPackage;
};

/**
 * @param {string} packageName
 * @return {BugPackPackage}
 */
BugPackRegistry.prototype.getPackage = function(packageName) {
    if (this.hasPackage(packageName)) {
        return this.packages[packageName];
    }
    return null;
};

/**
 * @param {string} packageName
 * @return {boolean}
 */
BugPackRegistry.prototype.hasPackage = function(packageName) {
    return Object.prototype.hasOwnProperty.call(this.packages, packageName);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {boolean}
 */
BugPackRegistry.prototype.hasSourceForExport = function(packageName, exportName) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    return Object.prototype.hasOwnProperty.call(this.registryKeyToBugPackSourceMap, registryKey);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {BugPackSource}
 */
BugPackRegistry.prototype.getBugPackSource = function(packageName, exportName) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    if (Object.prototype.hasOwnProperty.call(this.registryKeyToBugPackSourceMap, registryKey)) {
        return this.registryKeyToBugPackSourceMap[registryKey];
    }
    return null;
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackRegistry.prototype.registerExport = function(packageName, exportName, bugPackExport) {
    var bugPackPackage = this.getPackage(packageName);
    if (!bugPackPackage) {
        throw new Error("Cannot register an export to a package that does not exist.'" + packageName + "'");
    }
    bugPackPackage.export(exportName, bugPackExport);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @param {BugPackSource} bugPackSource
 */
BugPackRegistry.prototype.registerExportSource = function(packageName, exportName, bugPackSource) {
    var registryKey = this.generateRegistryKey(packageName, exportName);
    var registeredSource = this.getBugPackSource(packageName, exportName);
    if (registeredSource) {
        throw new Error("Package '" + packageName + "' already has a source registered for export '" +
            exportName + "'");
    }
    this.registryKeyToBugPackSourceMap[registryKey] = bugPackSource;
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} packageName
 * @param {string} exportName
 * @return {string}
 */
BugPackRegistry.prototype.generateRegistryKey = function(packageName, exportName) {
    return packageName + "+" + exportName;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistry;
