//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var path = require('path');

var BugPackKey = require('./BugPackKey');
var BugPackPackage = require('./BugPackPackage');
var BugPackRegistry = require('./BugPackRegistry');
var NodeBugPackScanner = require('./NodeBugPackScanner');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackContext = function(moduleTopDir, bugPackApi) {

    /**
     * @private
     * @type {BugPackApi}
     */
    this.bugPackApi = bugPackApi;

    /**
     * @private
     * @type {boolean}
     */
    this.generated = false;

    /**
     * @private
     * @type {string}
     */
    this.moduleTopDir = moduleTopDir;

    /**
     * @private
     * @type {Object}
     */
    this.packages = {};

    /**
     * @private
     * @type {BugPackRegistry}
     */
    this.registry = null;

    /**
     * @private
     * @type {Array<string>}
     */
    this.requireStack = [];
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {BugPackRegistry}
 */
BugPackContext.prototype.getRegistry = function() {
    return this.registry;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} bugPackKeyString
 * @param {*} bugPackExport
 */
BugPackContext.prototype.export = function(bugPackKeyString, bugPackExport) {
    var bugPackKey = this.generateBugPackKey(bugPackKeyString);
    this.registerExport(bugPackKey.getPackageName(), bugPackKey.getExportName(), bugPackExport);
};

/**
 *
 */
BugPackContext.prototype.generate = function() {
    if (!this.generated) {
        this.generated = true;
        this.generateRegistry();
    }
};

/**
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.require = function(bugPackKeyString) {
    return this.requireExport(bugPackKeyString);
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {string} bugPackKeyString
 * @return {BugPackKey}
 */
BugPackContext.prototype.generateBugPackKey = function(bugPackKeyString) {
    return new BugPackKey(bugPackKeyString);
};

/**
 * @private
 */
BugPackContext.prototype.generateRegistry = function() {
    var scanner = new NodeBugPackScanner(this.moduleTopDir);
    var registryFiles = scanner.scanForRegistryFiles();
    this.registry = new BugPackRegistry();
    this.registry.generate(registryFiles);
};

/**
 * @private
 * @param {string} packageName
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackContext.prototype.registerExport = function(packageName, exportName, bugPackExport) {
    this.registry.registerExport(packageName, exportName, bugPackExport);
};

/**
 * @private
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.requireExport = function(bugPackKeyString) {
    var bugPackKey = this.generateBugPackKey(bugPackKeyString);
    var key = bugPackKey.getKey();
    var exportName = bugPackKey.getExportName();
    var packageName = bugPackKey.getPackageName();
    var exportObject = null;

    if (this.requireStack.indexOf(key) !== -1) {
        throw new Error("Circular dependency in require calls. Requiring '" + key + "' which is already in the " +
            "require stack. " + JSON.stringify(this.requireStack));
    }

    if (this.registry.hasPackage(packageName)) {
        var bugPackPackage = this.registry.getPackage(packageName);
        this.requireStack.push(key);
        this.bugPackApi.setCurrentContext(this);
        if (!bugPackPackage.hasExport(exportName)) {
            if (this.registry.hasEntryForExport(packageName, exportName)) {
                var registryEntry = this.registry.getEntryByPackageAndExport(packageName, exportName);
                var bugPackSource = registryEntry.getBugPackSource();
                if (!bugPackSource.hasLoaded()) {
                    bugPackSource.loadSync();
                    exportObject = bugPackPackage.require(exportName);
                } else {
                    throw new Error("Source '" + bugPackSource.getSourceFilePath() + "' has already been loaded and " +
                        "export '" + exportName + "' is still not found in package '" + packageName + "'");
                }
            } else {
                throw new Error("Cannot find export '" + exportName + "' in package '" + packageName + "' and no " +
                    "source has been registered for this export");
            }
        } else {
            exportObject = bugPackPackage.require(exportName);
        }

        this.requireStack.pop();
    } else {
        throw new Error("Registry does not have package '" + packageName + "'");
    }

    return exportObject;
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------



//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackContext;