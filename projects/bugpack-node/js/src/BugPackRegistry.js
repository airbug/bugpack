/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var path                    = require('path');

var BugPackKey              = require('./BugPackKey');
var BugPackRegistryEntry    = require('./BugPackRegistryEntry');
var BugPackSource           = require('./BugPackSource');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

/**
 * @constructor
 */
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
 * @param {function(Error=)} callback
 */
BugPackRegistry.prototype.generate = function(registryFiles, callback) {
    var _this           = this;
    var error           = null;
    var numberExpected  = registryFiles.length;
    var numberComplete  = 0;

    if (numberExpected > 0) {
        registryFiles.forEach(function(registryFile) {
            registryFile.loadRegistryContents(function(returnedError, registryEntriesObject) {
                numberComplete++;
                if (!returnedError) {
                    var registryPath = registryFile.getRegistryPath();
                    _this.processRegistryEntriesObject(registryPath, registryEntriesObject);
                } else {
                    error = returnedError;
                }

                if (numberComplete === numberExpected) {
                    callback(error);
                }
            });
        });
    } else {
        callback();
    }
};

/**
 * @param {Array.<BugPackRegistryFile>} registryFiles
 */
BugPackRegistry.prototype.generateSync = function(registryFiles) {
    var _this = this;
    registryFiles.forEach(function(registryFile) {
        var registryEntriesObject   = registryFile.loadRegistryContentsSync();
        var registryPath            = registryFile.getRegistryPath();
        _this.processRegistryEntriesObject(registryPath, registryEntriesObject);
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
    sourceFilePath = path.resolve(sourceFilePath);
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
 * @private
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
        Error.stackTraceLimit = Infinity;
        throw new Error("Package '" + packageName + "' already has a registry entry registered for export '" +
            exportName + "'");
    }
    this.registryKeyToRegistryEntryMap[registryKey] = bugPackRegistryEntry;
};

/**
 * @private
 * @param {string} registryPath
 * @param {Object} registryEntriesObject
 */
BugPackRegistry.prototype.processRegistryEntriesObject = function(registryPath, registryEntriesObject) {
    var _this = this;
    for (var key in registryEntriesObject) {
        var registryEntry   = new BugPackRegistryEntry(registryPath, registryEntriesObject[key]);
        var exports         = registryEntry.getExports();
        var sourceFilePath  = registryEntry.getSourceFilePath();

        if (this.hasEntryForSourceFilePath(sourceFilePath)) {
            Error.stackTraceLimit = Infinity;
            throw new Error("The source file path '" + sourceFilePath + "' has already been registered");
        }

        this.registryEntries.push(registryEntry);
        this.sourceFilePathToRegistryEntryMap[sourceFilePath] = registryEntry;

        // NOTE BRN: export names are not required for exports. This can be useful when annotating files that are
        // loaded more like scripts.

        if (exports) {
            exports.forEach(function(exportKey) {
                var bugPackKey = _this.generateBugPackKey(exportKey);
                _this.mapExportName(bugPackKey.getPackageName(), bugPackKey.getExportName(), registryEntry);
            });
        }
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistry;
