//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var BugPackKey = require('./BugPackKey');
var BugPackPackage = require('./BugPackPackage');
var BugPackRegistry = require('./BugPackRegistry');
var BugPackRegistryFile = require('./BugPackRegistryFile');
var PathUtil = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackContext = function(moduleTopDir, bugPackApi) {

    /**
     * @private
     * @type {boolean}
     */
    this.autoloaded = false;

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
 *
 */
BugPackContext.prototype.autoload = function() {
    var _this = this;
    if (!this.autoloaded) {
        this.autoloaded = true;
        var registry = this.getRegistry();
        var registryEntries = registry.getRegistryEntries();
        registryEntries.forEach(function(registryEntry) {
            var annotations = registryEntry.getAnnotations();
            for (var i = 0, size = annotations.length; i < size; i++) {
                var annotation = annotations[i];
                if (annotation.name === "Autoload") {
                    _this.bugPackApi.setCurrentContext(_this);
                    var bugPackSource = registryEntry.getBugPackSource();
                    bugPackSource.loadSync();
                    break;
                }
            }
        });
    }
};

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
    var bugpackRegistryPath = path.resolve(this.moduleTopDir, "bugpack-registry.json");
    if (PathUtil.isFileSync(bugpackRegistryPath)) {
        var registryFiles = [];
        registryFiles.push(new BugPackRegistryFile(bugpackRegistryPath));
        this.registry = new BugPackRegistry();
        this.registry.generate(registryFiles);
    } else {
        throw new Error("Cannot find bugpack-registry.json file");
    }
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
