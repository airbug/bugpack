//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs                      = require('fs');
var path                    = require('path');

var BugPackKey              = require('./BugPackKey');
var BugPackLibrary          = require('./BugPackLibrary');
var BugPackPackage          = require('./BugPackPackage');
var BugPackRegistry         = require('./BugPackRegistry');
var BugPackRegistryFile     = require('./BugPackRegistryFile');
var PathUtil                = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackContext = function(moduleTopDir, bugPackApi) {

    /**
     * @private
     * @type {boolean}
     */
    this.autoloaded     = false;

    /**
     * @private
     * @type {BugPackApi}
     */
    this.bugPackApi     = bugPackApi;

    /**
     * @private
     * @type {boolean}
     */
    this.generated      = false;

    /**
     * @private
     * @type {BugPackLibrary}
     */
    this.library        = new BugPackLibrary();

    /**
     * @private
     * @type {Array.<string>}
     */
    this.loadStack          = [];

    /**
     * @private
     * @type {string}
     */
    this.moduleTopDir   = moduleTopDir;

    /**
     * @private
     * @type {Object}
     */
    this.processedSources   = {};

    /**
     * @private
     * @type {BugPackRegistry}
     */
    this.registry       = new BugPackRegistry();

    /**
     * @private
     * @type {Array<string>}
     */
    this.requireStack   = [];
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
        var autoloadCount = 0;
        var autoloadCompletedCount = 0;
        var allEntriesProcessed = false;
        var autoloadComplete = false;
        registryEntries.forEach(function(registryEntry) {
            if (registryEntry.getAutoload()) {
                autoloadCount++;
                var bugPackSource = registryEntry.getBugPackSource();
                _this.loadSource(bugPackSource, function(error) {
                    if (!error) {
                        autoloadCompletedCount++;
                        if (autoloadCompletedCount === autoloadCount && allEntriesProcessed && !autoloadComplete) {
                            autoloadComplete = true;
                            callback();
                        }
                    } else {
                        callback(error);
                    }
                });
            }
        });
        allEntriesProcessed = true;
        if (autoloadCompletedCount === autoloadCount && allEntriesProcessed && !autoloadComplete) {
            autoloadComplete = true;
            callback();
        }
    }
};

/**
 * @param {string} bugPackKeyString
 * @param {*} bugPackExport
 */
BugPackContext.prototype.export = function(bugPackKeyString, bugPackExport) {
    if (!bugPackKeyString) {
        throw new Error("Expected string for 'bugPackKeyString' instead found ", bugPackKeyString);
    }
    if (!bugPackExport) {
        throw new Error("Expected object or function for 'bugPackExport' instead found ", bugPackExport);
    }
    var bugPackKey = this.generateBugPackKey(bugPackKeyString);
    this.registerExport(bugPackKey.getPackageName(), bugPackKey.getExportName(), bugPackExport);
};

/**
 *
 */
BugPackContext.prototype.generate = function() {
    if (!this.generated) {
        this.generated = true;
        this.loadRegistry();
    }
};

/**
 * @param {string} packageName
 * @return {BugPackPackage}
 */
BugPackContext.prototype.getPackage = function(packageName) {
    return this.library.getPackage(packageName);
};

/**
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.require = function(bugPackKeyString) {
    return this.requireByKey(bugPackKeyString);
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
 * @param {string} bugPackKeyString
 * @param {function(Error)} callback
 */
BugPackContext.prototype.loadExport = function(bugPackKeyString, callback) {
    var bugPackKey = this.generateBugPackKey(bugPackKeyString);
    var registryEntry = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        if (this.loadStack.indexOf(bugPackKeyString) !== -1) {
            callback(new Error("Circular dependency in load calls. Requiring '" + bugPackKeyString + "' which is already in the " +
                "load stack. " + JSON.stringify(this.loadStack)));
        } else {
            this.loadStack.push(bugPackKeyString);
            this.loadSource(bugPackSource, callback);
            this.loadStack.pop();
        }
    } else {
        callback(new Error("Cannot find registry entry '" + bugPackKeyString + "'"));
    }
};

/**
 * @private
 */
BugPackContext.prototype.loadRegistry = function() {
    var bugpackRegistryPath = path.resolve(this.moduleTopDir, "bugpack-registry.json");
    if (PathUtil.isFileSync(bugpackRegistryPath)) {
        var registryFiles = [];
        registryFiles.push(new BugPackRegistryFile(bugpackRegistryPath));
        this.registry.generate(registryFiles);
    } else {
        throw new Error("Cannot find bugpack-registry.json file");
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 * @param {function(Error)} callback
 */
BugPackContext.prototype.loadSource = function(bugPackSource, callback) {
    if (!bugPackSource.hasLoaded()) {
        if (!bugPackSource.hasLoadStarted() && !this.hasProcessedSource(bugPackSource)) {
            this.processSource(bugPackSource, callback);
        } else {
            bugPackSource.addLoadCallback(callback);
        }
    } else {
        callback();
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 * @param {function(Error)} callback
 */
BugPackContext.prototype.processSource = function(bugPackSource, callback) {
    var _this = this;
    this.processedSources[bugPackSource.getSourceFilePath()] = true;
    var registryEntry = this.registry.getEntryBySourceFilePath(bugPackSource.getSourceFilePath());
    var requiredExports = registryEntry.getRequires();
    if (requiredExports.length > 0) {
        var loadedExportsCount = 0;
        requiredExports.forEach(function(requiredExport) {
            _this.loadExport(requiredExport, function(error) {
                if (!error) {
                    loadedExportsCount++;
                    if (loadedExportsCount === requiredExports.length) {
                        _this.bugPackApi.setCurrentContext(_this);
                        bugPackSource.addLoadCallback(callback);
                        bugPackSource.load();
                    }
                } else {
                    callback(error);
                }
            });
        });
    } else {
        this.bugPackApi.setCurrentContext(this);
        bugPackSource.addLoadCallback(callback);
        bugPackSource.load();
    }
};

/**
 * @private
 * @param {string} packageName
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackContext.prototype.registerExport = function(packageName, exportName, bugPackExport) {
    this.library.registerExport(packageName, exportName, bugPackExport);
};

/**
 * @private
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.requireByKey = function(bugPackKeyString) {
    var requiredObject = undefined;
    var bugPackKey = this.generateBugPackKey(bugPackKeyString);
    if (bugPackKey.isWildCard()) {
        requiredObject = this.requirePackage(bugPackKey);
    } else {
        requiredObject = this.requireExport(bugPackKey);
    }
    return requiredObject;
};

/**
 * @private
 * @param {BugPackKey} bugPackKey
 * @return {*}
 */
BugPackContext.prototype.requireExport = function(bugPackKey) {
    var key = bugPackKey.getKey();
    var exportName = bugPackKey.getExportName();
    var packageName = bugPackKey.getPackageName();
    var exportObject = undefined;

    if (this.requireStack.indexOf(key) !== -1) {
        throw new Error("Circular dependency in require calls. Requiring '" + key + "' which is already in the " +
            "require stack. " + JSON.stringify(this.requireStack));
    }

    if (this.library.hasPackage(packageName)) {
        var bugPackPackage = this.library.getPackage(packageName);
        this.requireStack.push(key);
        this.bugPackApi.setCurrentContext(this);
        if (bugPackPackage.hasExport(exportName)) {
            exportObject = bugPackPackage.require(exportName);
        }
        this.requireStack.pop();
    }

    if (!exportObject) {
        if (this.registry.hasEntryForExport(packageName, exportName)) {
            var registryEntry = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
            var bugPackSource = registryEntry.getBugPackSource();
            if (bugPackSource.hasLoaded()) {
                throw new Error("Export found and it was loaded but nothing was exported. Ensure that '" + key + "' actually exports something by that name.");
            } else {
                throw new Error("Export found but has not been loaded. Must first load '" + key +
                    "' before requiring it.");
            }
        } else {
            throw new Error("Cannot find export '" + exportName + "' in package '" + packageName + "' and no " +
                "source has been registered for this export");
        }
    }

    return exportObject;
};

/**
 * @private
 * @param {BugPackKey} bugPackKey
 * @return {*}
 */
BugPackContext.prototype.requirePackage = function(bugPackKey) {
    var packageName = bugPackKey.getPackageName();
    var packageObject = undefined;

    if (this.library.hasPackage(packageName)) {
        var bugPackPackage = this.library.getPackage(packageName);
        packageObject = {};
        var exports = bugPackPackage.getExports();
        for (var exportName in exports) {
            var exportKey = packageName + "." + exportName;
            packageObject[exportName] = this.requireExport(exportKey);
        }
    }

    return packageObject;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackContext;
