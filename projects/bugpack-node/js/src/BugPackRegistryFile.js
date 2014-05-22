/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryFile = function(registryFilePath) {

    /**
     * @private
     * @type {string}
     */
    this.registryFilePath = registryFilePath;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackRegistryFile.prototype.getRegistryPath = function() {
    return path.dirname(this.registryFilePath);
};

/**
 * @param {function(Error, Object=)} callback
 */
BugPackRegistryFile.prototype.loadRegistryContents = function(callback) {
    fs.readFile(this.registryFilePath, {encoding: "utf8"}, function(error, data) {
        if (!error) {
            callback(null, JSON.parse(data));
        } else {
            callback(error);
        }
    });
};

/**
 * @return {Object}
 */
BugPackRegistryFile.prototype.loadRegistryContentsSync = function() {
    return JSON.parse(fs.readFileSync(this.registryFilePath, {encoding: "utf8"}));
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistryFile;
