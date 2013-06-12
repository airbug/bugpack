//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackContext = function(contextUrl, bugPackApi) {

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
     * @type {string}
     */
    this.contextUrl = contextUrl;

    /**
     * @private
     * @type {boolean}
     */
    this.loaded = false;

    /**
     * @private
     * @type {Array.<string>}
     */
    this.loadStack = [];

    /**
     * @private
     * @type {Object}
     */
    this.packages = {};

    /**
     * @private
     * @type {Object}
     */
    this.processedSources = {};

    /**
     * @private
     * @type {BugPackRegistry}
     */
    this.registry = new BugPackRegistry();

    //TODO BRN: Add support for contextUrls in the form of "url/" and "url". Also support the default "*" which is a context that does not have a registry
    /**
     * @private
     * @type {BugPackRegistryFile}
     */
    this.registryFile = new BugPackRegistryFile(contextUrl + "/bugpack-registry.json");

    /**
     * @private
     * @type {Array.<string>}
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

// Export
//-------------------------------------------------------------------------------

/**
 * @param {function(Error)} callback
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
            var annotations = registryEntry.getAnnotations();
            for (var i = 0, size = annotations.length; i < size; i++) {
                var annotation = annotations[i];
                if (annotation.name === "Autoload") {
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
                    break;
                }
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
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.require = function(bugPackKeyString) {
    return this.requireExport(bugPackKeyString);
};


// Context
//-------------------------------------------------------------------------------

/**
 * @param {Object} callback
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
    if (this.processedSources[bugPackSource.getSourceFilePath()]) {
        return true;
    }
    return false;
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
 * @param {function(Error)} callback
 */
BugPackContext.prototype.loadRegistry = function(callback) {
    var _this = this;
    this.registryFile.loadRegistryContents(function(error, registryJson) {

        //TEST
        console.log("Load registry json complete");
        console.log(registryJson);

        if (!error) {
            _this.registry.generate(_this.registryFile, registryJson);
            callback(null);
        } else {
             callback(error);
        }
    });
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
                        //TODO BRN: This doesn't quite work since this requires sync code. Instead we need to use a key on the start of load and on th execution of context
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
        //TODO BRN: This doesn't quite work since this requires sync code. Instead we need to use a key on the start of load and on th execution of context
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
                throw new Error("Export found but has not been loaded. Must first load '" + bugPackKeyString +
                    "' before requiring it.");
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
