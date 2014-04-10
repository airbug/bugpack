//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs                      = require('fs');
var path                    = require('path');

var BugPackKey              = require('./BugPackKey');
var BugPackLibrary          = require('./BugPackLibrary');
var BugPackSourceProcessor  = require('./BugPackSourceProcessor');
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
    this.autoloaded             = false;

    /**
     * @private
     * @type {BugPackApi}
     */
    this.bugPackApi             = bugPackApi;

    /**
     * @private
     * @type {boolean}
     */
    this.generated              = false;

    /**
     * @private
     * @type {BugPackLibrary}
     */
    this.library                = new BugPackLibrary();

    /**
     * @private
     * @type {boolean}
     */
    this.loaded                 = false;

    /**
     * @private
     * @type {string}
     */
    this.moduleTopDir           = moduleTopDir;

    /**
     * @private
     * @type {Array.<string>}
     */
    this.processingExportStack  = [];

    /**
     * @private
     * @type {BugPackRegistry}
     */
    this.registry               = new BugPackRegistry();

    /**
     * @private
     * @type {Array<string>}
     */
    this.requireStack           = [];

    /**
     * @private
     * @type {Object}
     */
    this.sourceProcessors       = {};
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {BugPackApi}
 */
BugPackContext.prototype.getBugPackApi = function() {
    return this.bugPackApi;
};

/**
 * @return {Array.<string>}
 */
BugPackContext.prototype.getProcessingExportStack = function() {
    return this.processingExportStack;
};

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
    if (!bugPackKeyString) {
        throw new Error("Expected string for 'bugPackKeyString' instead found ", bugPackKeyString);
    }
    if (!bugPackExport) {
        throw new Error("Expected object or function for 'bugPackExport' instead found ", bugPackExport);
    }
    var bugPackKey = this.factoryBugPackKey(bugPackKeyString);
    this.registerExport(bugPackKey.getPackageName(), bugPackKey.getExportName(), bugPackExport);
};

/**
 * @param {string} bugPackKeyString
 * @return {BugPackKey}
 */
BugPackContext.prototype.factoryBugPackKey = function(bugPackKeyString) {
    return new BugPackKey(bugPackKeyString);
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
    var bugPackKey      = this.factoryBugPackKey(bugPackKeyString);
    var registryEntry   = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        this.processBugPackSource(bugPackSource, callback);
    } else {
        callback(new Error("Cannot find registry entry '" + bugPackKeyString + "'"));
    }
};

/**
 * @param {string} bugPackKeyString
 */
BugPackContext.prototype.loadExportSync = function(bugPackKeyString) {
    var bugPackKey      = this.factoryBugPackKey(bugPackKeyString);
    var registryEntry   = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        this.processBugPackSourceSync(bugPackSource);
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
                    if (returnedError && !error) {
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
 * @param {string} sourceFilePath
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadSource = function(sourceFilePath, callback) {
    var registryEntry   = this.registry.getEntryBySourceFilePath(sourceFilePath);
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        this.processBugPackSource(bugPackSource, callback);
    } else {
        callback(new Error("Cannot find registry entry for source file '" + sourceFilePath + "'"));
    }
};

/**
 * @param {string} sourceFilePath
 */
BugPackContext.prototype.loadSourceSync = function(sourceFilePath) {
    var registryEntry   = this.registry.getEntryBySourceFilePath(sourceFilePath);
    if (registryEntry) {
        var bugPackSource = registryEntry.getBugPackSource();
        this.processBugPackSourceSync(bugPackSource);
    } else {
        throw new Error("Cannot find registry entry for source file '" + sourceFilePath + "'");
    }
};

/**
 * @param {Array.<string>} sourceFilePaths
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadSources = function(sourceFilePaths, callback) {
    var _this           = this;
    var loadCount       = 0;
    var error           = null;

    if (sourceFilePaths instanceof Array) {
        var expectedCount   = sourceFilePaths.length;
        if (expectedCount > 0) {
            sourceFilePaths.forEach(function(sourceFilePath) {
                _this.loadSource(sourceFilePath, function(returnedError) {
                    loadCount++;
                    if (returnedError && !error) {
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
        callback(new Error("sourceFilePaths must be an Array"));
    }
};

/**
 * @param {Array.<string>} sourceFilePaths
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.loadSourcesSync = function(sourceFilePaths, callback) {
    var _this           = this;
    if (sourceFilePaths instanceof Array) {
        sourceFilePaths.forEach(function(sourceFilePath) {
            _this.loadSourceSync(sourceFilePath);
        });
    } else {
        throw new Error("sourceFilePaths must be an Array");
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
// Protected Methods
//-------------------------------------------------------------------------------

/**
 * @protected
 * @param {string} bugPackKeyString
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.processExport = function(bugPackKeyString, callback) {
    if (this.processingExportStack.indexOf(bugPackKeyString) !== -1) {
        callback(new Error("Circular dependency in load calls. Requiring '" + bugPackKeyString + "' which is already in the " +
            "load stack. " + JSON.stringify(this.processingExportStack)));
    } else {
        var bugPackKey      = this.factoryBugPackKey(bugPackKeyString);
        var registryEntry   = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
        if (registryEntry) {
            var bugPackSource   = registryEntry.getBugPackSource();
            this.processingExportStack.push(bugPackKeyString);
            this.processBugPackSource(bugPackSource, callback);
            this.processingExportStack.pop();
        } else {
            callback(new Error("Cannot find registry entry '" + bugPackKeyString + "'"));
        }
    }
};

/**
 * @protected
 * @param {string} bugPackKeyString
 */
BugPackContext.prototype.processExportSync = function(bugPackKeyString) {
    if (this.processingExportStack.indexOf(bugPackKeyString) !== -1) {
        throw new Error("Circular dependency in load calls. Requiring '" + bugPackKeyString + "' which is already in the " +
            "load stack. " + JSON.stringify(this.processingExportStack));
    } else {
        var bugPackKey      = this.factoryBugPackKey(bugPackKeyString);
        var registryEntry   = this.registry.getEntryByPackageAndExport(bugPackKey.getPackageName(), bugPackKey.getExportName());
        if (registryEntry) {
            var bugPackSource = registryEntry.getBugPackSource();
            this.processingExportStack.push(bugPackKeyString);
            this.processBugPackSourceSync(bugPackSource);
            this.processingExportStack.pop();
        } else {
            throw new Error("Cannot find registry entry '" + bugPackKeyString + "'");
        }
    }
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------


/**
 * @private
 * @param {function(Error=)} callback
 */
BugPackContext.prototype.autoload = function(callback) {
    var _this = this;
    if (!this.autoloaded) {
        this.autoloaded             = true;
        var registry                = this.getRegistry();
        var registryEntries         = registry.getRegistryEntries();
        var autoloadCount           = 0;
        var autoloadCompletedCount  = 0;
        var allEntriesProcessed     = false;
        var autoloadComplete        = false;
        registryEntries.forEach(function(registryEntry) {
            if (registryEntry.getAutoload()) {
                autoloadCount++;
                var bugPackSource = registryEntry.getBugPackSource();
                _this.processBugPackSource(bugPackSource, function(error) {
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
 * @private
 */
BugPackContext.prototype.autoloadSync = function() {
    var _this = this;
    if (!this.autoloaded) {
        this.autoloaded         = true;
        var registry            = this.getRegistry();
        var registryEntries     = registry.getRegistryEntries();
        registryEntries.forEach(function(registryEntry) {
            if (registryEntry.getAutoload()) {
                var bugPackSource = registryEntry.getBugPackSource();
                _this.processBugPackSourceSync(bugPackSource);
            }
        });
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 * @return {BugPackSourceProcessor}
 */
BugPackContext.prototype.generateBugPackSourceProcessor = function(bugPackSource) {
    var sourceProcessor = this.sourceProcessors[bugPackSource.getSourceFilePath()];
    if (!sourceProcessor) {
        sourceProcessor = new BugPackSourceProcessor(bugPackSource, this);
        this.sourceProcessors[bugPackSource.getSourceFilePath()] = sourceProcessor;
    }
    return sourceProcessor;
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
BugPackContext.prototype.processBugPackSource = function(bugPackSource, callback) {
    var sourceProcessor = this.generateBugPackSourceProcessor(bugPackSource);
    if (!sourceProcessor.hasProcessed()) {
        sourceProcessor.addProcessedCallback(callback);
        if (!sourceProcessor.hasProcessingStarted()) {
            sourceProcessor.process();
        }
    } else {
        callback();
    }
};

/**
 * @private
 * @param {BugPackSource} bugPackSource
 */
BugPackContext.prototype.processBugPackSourceSync = function(bugPackSource) {
    var sourceProcessor = this.generateBugPackSourceProcessor(bugPackSource);
    if (!sourceProcessor.hasProcessed()) {

        //TODO BRN: What do we do if this is the case?

        //if (!sourceProcessor.hasProcessingStarted()) {

            sourceProcessor.processSync();
        //}
    } else {

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
    var bugPackKey = this.factoryBugPackKey(bugPackKeyString);
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
