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

/**
 * @constructor
 * @param {string} moduleTopDir
 * @param {BugPackApi} bugPackApi
 */
var BugPackContext = function(moduleTopDir, bugPackApi) {

    /**
     * @private
     * @type {boolean}
     */
    this.autoloaded         = false;

    /**
     * @private
     * @type {BugPackApi}
     */
    this.bugPackApi         = bugPackApi;

    /**
     * @private
     * @type {boolean}
     */
    this.generated          = false;

    /**
     * @private
     * @type {boolean}
     */
    this.loaded             = false;

    /**
     * @private
     * @type {BugPackLibrary}
     */
    this.library            = new BugPackLibrary();

    /**
     * @private
     * @type {Array.<string>}
     */
    this.loadStack          = [];

    /**
     * @private
     * @type {string}
     */
    this.moduleTopDir       = moduleTopDir;

    /**
     * @private
     * @type {Object}
     */
    this.processedSources   = {};

    /**
     * @private
     * @type {BugPackRegistry}
     */
    this.registry           = new BugPackRegistry();

    /**
     * @private
     * @type {Array<string>}
     */
    this.requireStack       = [];
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
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.autoload = function(callback) {
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
 *
 */
BugPackContext.prototype.autoloadSync = function() {
    var _this = this;
    if (!this.autoloaded) {
        this.autoloaded = true;
        var registry                = this.getRegistry();
        var registryEntries         = registry.getRegistryEntries();
        registryEntries.forEach(function(registryEntry) {
            if (registryEntry.getAutoload()) {
                var bugPackSource = registryEntry.getBugPackSource();
                _this.loadSourceSync(bugPackSource);
            }
        });
    }
};

/**
 * @param {string} bugPackKeyString
 * @param {*} bugPackExport
 */
BugPackContext.prototype.export = function(bugPackKeyString, bugPackExport) {

    //TEST
    console.log("Exporting '", bugPackKeyString, "'");

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
 * @param {string} packageName
 * @return {BugPackPackage}
 */
BugPackContext.prototype.getPackage = function(packageName) {
    return this.library.getPackage(packageName);
};

/**
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadContext = function(callback) {
    var _this = this;
    if (!this.loaded) {
        this.loaded = true;
        this.loadRegistry(function(error) {
            if (!error) {
                _this.bugPackApi.setCurrentContext(_this);
                _this.autoload(function(error) {
                    callback(error);
                });
            } else {
                callback(error);
            }
        });
    } else {
        callback(new Error("Context already loaded"));
    }
};

/**
 *
 */
BugPackContext.prototype.loadContextSync = function() {
    if (!this.loaded) {
        this.loaded = true;
        this.loadRegistrySync();
        this.bugPackApi.setCurrentContext(this);
        this.autoloadSync();
    } else {
        throw new Error("Context already loaded");
    }
};

/**
 * @param {string} bugPackKeyString
 * @param {function(Error=)} callback
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
 * @param {string} bugPackKeyString
 */
BugPackContext.prototype.loadExportSync = function(bugPackKeyString) {

    //TEST
    console.log("BugPackContext#loadExportSync - bugPackKeyString:", bugPackKeyString);

    var bugPackKey      = this.generateBugPackKey(bugPackKeyString);
    var registryEntry   = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        if (this.loadStack.indexOf(bugPackKeyString) !== -1) {
            throw new Error("Circular dependency in load calls. Requiring '" + bugPackKeyString + "' which is already in the " +
                "load stack. " + JSON.stringify(this.loadStack));
        } else {
            this.loadStack.push(bugPackKeyString);
            this.loadSourceSync(bugPackSource);
            this.loadStack.pop();
        }
    } else {
        throw new Error("Cannot find registry entry '" + bugPackKeyString + "'");
    }
};

/**
 * @param {Array.<string>} bugPackKeyStrings
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadExports = function(bugPackKeyStrings, callback) {
    var _this           = this;
    var loadCount       = 0;
    var error           = null;

    if (bugPackKeyStrings instanceof Array) {
        var expectedCount   = bugPackKeyStrings.length;
        if (expectedCount > 0) {
            bugPackKeyStrings.forEach(function(bugPackKeyString) {
                _this.loadExport(bugPackKeyString, function(returnedError) {
                    loadCount++;
                    if (returnedError) {
                        error = returnedError;
                    }
                    if (loadCount === expectedCount) {
                        callback(error);
                    }
                });
            });
        } else {
            callback();
        }
    } else {
        callback(new Error("bugPackKeyStrings must be an Array"));
    }
};

/**
 * @param {Array.<string>} bugPackKeyStrings
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadExportsSync = function(bugPackKeyStrings, callback) {
    var _this           = this;
    if (bugPackKeyStrings instanceof Array) {
        bugPackKeyStrings.forEach(function(bugPackKeyString) {
            _this.loadExportSync(bugPackKeyString);
        });
    } else {
        throw new Error("bugPackKeyStrings must be an Array");
    }
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
 * @param {BugPackSource} bugPackSource
 * @return {boolean}
 */
BugPackContext.prototype.hasProcessedSource = function(bugPackSource) {
    return !!this.processedSources[bugPackSource.getSourceFilePath()];
};

/**
 * @private
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadRegistry = function(callback) {
    var _this               = this;
    var bugpackRegistryPath = path.resolve(this.moduleTopDir, "bugpack-registry.json");
    PathUtil.isFile(bugpackRegistryPath, function(error, isFile) {
        if (!error) {
            if (isFile) {
                var registryFiles = [];
                registryFiles.push(new BugPackRegistryFile(bugpackRegistryPath));
                _this.registry.generate(registryFiles, callback);
            } else {
                callback(new Error("Cannot find bugpack-registry.json file"));
            }
        } else {
            callback(error);
        }
    });
};

/**
 * @private
 */
BugPackContext.prototype.loadRegistrySync = function() {
    var bugpackRegistryPath = path.resolve(this.moduleTopDir, "bugpack-registry.json");
    if (PathUtil.isFileSync(bugpackRegistryPath)) {
        var registryFiles = [];
        registryFiles.push(new BugPackRegistryFile(bugpackRegistryPath));
        this.registry.generateSync(registryFiles);
    } else {
        throw new Error("Cannot find bugpack-registry.json file");
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 * @param {function(Error=)} callback
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
 */
BugPackContext.prototype.loadSourceSync = function(bugPackSource) {
    if (!bugPackSource.hasLoaded()) {
        if (!bugPackSource.hasLoadStarted() && !this.hasProcessedSource(bugPackSource)) {
            this.processSourceSync(bugPackSource);
        }
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 * @param {function(Error=)} callback
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
 * @param {BugPackSource} bugPackSource
 */
BugPackContext.prototype.processSourceSync = function(bugPackSource) {

    //TEST
    console.log("Processing source '", bugPackSource.getSourceFilePath(), "'");

    var _this = this;
    this.processedSources[bugPackSource.getSourceFilePath()] = true;
    var registryEntry       = this.registry.getEntryBySourceFilePath(bugPackSource.getSourceFilePath());
    var requiredExports     = registryEntry.getRequires();
    requiredExports.forEach(function(requiredExport) {
        _this.loadExportSync(requiredExport);
    });
    this.bugPackApi.setCurrentContext(this);
    bugPackSource.loadSync();
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
