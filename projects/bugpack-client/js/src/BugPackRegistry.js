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
    this.registryKeyToRegistryEntryMap = {};

    /**
     * @private
     * @type {Array.<BugPackRegistryEntry>}
     */
    this.registryEntries = [];
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
 * @param {Array.<BugPackRegistryFile>} registryFiles
 */
/*BugPackRegistry.prototype.generate = function(registryFiles) {
    var _this = this;
    this.createPackage(".");
    registryFiles.forEach(function(registryFile) {
        var registryEntryJsons = registryFile.loadRegistryContents();
        var registryPath = registryFile.getRegistryPath();
        for (var key in registryEntryJsons) {
            var registryEntry = new BugPackRegistryEntry(registryPath, registryEntryJsons[key]);
            _this.registryEntries.push(registryEntry);

            var packageName = registryEntry.getPackageName();
            var exportNames = registryEntry.getExportNames();
            var sourceFilePath = registryEntry.getSourceFilePath();

            if (!_this.hasPackage(packageName)) {
                _this.createPackage(packageName);
            }

            // NOTE BRN: export names are not required for exports. This can be useful when annotating files that are
            // loaded more like scripts.

            if (exportNames) {
                exportNames.forEach(function(exportName) {
                    _this.mapExportName(packageName, exportName, registryEntry);
                });
            }

            if (_this.hasEntryForSourceFilePath(sourceFilePath)) {
                throw new Error("The source file path '" + sourceFilePath + "' has already been registered");
            }
            _this.sourceFilePathToRegistryEntryMap[sourceFilePath] = registryEntry;
        }
    });
};*/

/**
 *
 */
BugPackRegistry.prototype.generate = function() {
    this.createPackage(".");
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
        return this.registryKeyToRegistryEntryMap[sourceFilePath];
    }
    return null;
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackRegistry.prototype.registerExport = function(packageName, exportName, bugPackExport) {

    /*if (!bugPackPackage) {
        throw new Error("Cannot register an export to a package that does not exist.'" + packageName + "'");
    }*/

    //TODO BRN: This is a temporary hack until we implement the registry stuff for client code
    if (!this.hasPackage(packageName)) {
        this.createPackage(packageName);
    }
    var bugPackPackage = this.getPackage(packageName);
    bugPackPackage.export(exportName, bugPackExport);
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
