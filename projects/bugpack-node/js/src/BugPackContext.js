//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var BugPackKey = require('./BugPackKey');
var BugPackPackage = require('./BugPackPackage');
var BugPackRegistry = require('./BugPackRegistry');
var BugPackSource = require('./BugPackSource');
var NodeBugPackScanner = require('./NodeBugPackScanner');
var PathUtil = require('./PathUtil');


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
 * @param {string} bugPackKeyString
 * @return {*}
 */
BugPackContext.prototype.require = function(bugPackKeyString) {
    return this.requireExport(bugPackKeyString);
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
    var _this = this;
    var scanner = new NodeBugPackScanner(this.moduleTopDir);
    var registryFiles = scanner.scanForRegistryFiles();

    this.registry = new BugPackRegistry();
    this.registry.createPackage(".");
    registryFiles.forEach(function(registryFile) {
        var registryContents = registryFile.loadRegistryContents();
        var registryPath = registryFile.getRegistryPath();
        for (var key in registryContents) {
            var registryEntry = registryContents[key];
            _this.validateRegistryEntry(registryEntry);


            var sourceFilePath = path.join(registryPath, registryEntry.path);
            var bugPackSource = new BugPackSource(sourceFilePath);
            var packageName = registryContents.package;
            var exportNames = registryEntry.exports;

            if (!packageName) {
                packageName = ".";
            }
            if (!_this.registry.hasPackage(packageName)) {
                _this.registry.createPackage(packageName);
            }

            // NOTE BRN: export names are not required for exports. This can be useful when annotating files that are
            // loaded more like scripts.

            if (exportNames) {
                exportNames.forEach(function(exportName) {
                    _this.registry.registerExportSource(packageName, exportName, bugPackSource);
                });
            }
        }
    });
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
            if (this.registry.hasSourceForExport(packageName, exportName)) {
                var bugPackSource = this.registry.getBugPackSource(packageName, exportName);
                if (!bugPackSource.hasLoaded()) {
                    bugPackSource.loadSync();
                    exportObject = bugPackPackage.export(exportName);
                } else {
                    throw new Error("Source '" + bugPackSource.getSourceFilePath() + "' has already been loaded and " +
                        "export '" + exportName + "' is still not found in package '" + packageName + "'");
                }
            } else {
                throw new Error("Cannot find export '" + exportName + "' in package '" + packageName + "' and no " +
                    "source has been registered for this export");
            }
        } else {
            exportObject = bugPackPackage.export(exportName);
        }

        this.requireStack.pop();
    } else {
        throw new Error("Registry does not have package '" + packageName + "'");
    }

    return exportObject;
};

/**
 * @private
 * @param {Object} registryEntry
 */
BugPackContext.prototype.validateRegistryEntry = function(registryEntry) {
    if (!registryEntry.path) {
        throw new Error("Path is required for registry entries. " + JSON.stringify(registryEntry));
    }
    if (!PathUtil.isFileSync(registryEntry.path)) {
        throw new Error("Path entry '" + registryEntry.path + "' must point to an existing file.");
    }

    //TODO BRN: Validate the package name using regex
    //TODO BRN: Validate the export names using regex
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------



//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackContext;
