/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//NOTE BRN: This file is no longer used.

//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var BugPackRegistryFile = require('./BugPackRegistryFile');
var PathUtil = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var NodeBugPackScanner = function(moduleTopDir) {

    /**
     * @private
     * @type {string}
     */
    this.moduleTopDir = moduleTopDir;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @return {Array.<BugPackRegistryFile>}
 */
NodeBugPackScanner.prototype.scanForRegistryFiles = function() {
    var registryFilePaths = this.discoverRegistryFiles();
    var bugPackRegistryFiles = [];
    registryFilePaths.forEach(function(registryFilePath) {
        bugPackRegistryFiles.push(new BugPackRegistryFile(registryFilePath));
    });
    return bugPackRegistryFiles;
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @return {Array.<string>}
 */
NodeBugPackScanner.prototype.discoverRegistryFiles = function() {
    if (PathUtil.isDirectorySync(this.moduleTopDir)) {
        return this.findRegistryFiles(this.moduleTopDir);
    } else {
        Error.stackTraceLimit = Infinity;
        throw new Error("Path '" + this.moduleTopDir + "' is not a directory.");
    }
};

/**
 * @private
 * @param {string} dirPath
 * @return {Array.<string>}
 */
NodeBugPackScanner.prototype.findRegistryFiles = function(dirPath) {
    var _this = this;
    var registryFilePaths = [];
    var dirList = fs.readdirSync(dirPath);
    dirList.forEach(function(dirItem) {
        var newPath = dirPath + path.sep + dirItem;
        if (PathUtil.isDirectorySync(newPath)) {

            //NOTE BRN: We only want to search directories in THIS node module. So do not search in sub modules.

            if (dirItem !== 'node_modules') {
                registryFilePaths = registryFilePaths.concat(_this.findRegistryFiles(newPath));
            }
        } else if (PathUtil.isFileSync(newPath)) {
            if (dirItem === 'bugpack-registry.json') {
                registryFilePaths.push(newPath);
            }
        }
    });
    return registryFilePaths;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = NodeBugPackScanner;
