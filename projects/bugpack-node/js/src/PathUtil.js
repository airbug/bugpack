/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var PathUtil = {};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} path
 * @param {function(Error, boolean)} callback
 */
PathUtil.isDirectory = function(path, callback) {
    fs.exists(path, function(exists) {
        if (exists) {
            fs.stat(path, function(error, stats) {
                if (!error) {
                    callback(null, stats.isDirectory());
                } else {
                    callback(error, false);
                }
            });
        } else {
            callback(null, false);
        }
    });
};

/**
 * @param {string} path
 * @return {boolean}
 */
PathUtil.isDirectorySync = function(path) {
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        return stats.isDirectory();
    }
    return false;
};

/**
 * @param {string} path
 * @param {function(Error, boolean)} callback
 */
PathUtil.isFile = function(path, callback) {
    fs.exists(path, function(exists) {
        if (exists) {
            fs.stat(path, function(error, stats) {
                if (!error) {
                    callback(null, stats.isFile());
                } else {
                    callback(error, false);
                }
            });
        } else {
            callback(null, false);
        }
    });
};

/**
 * @param {string} path
 * @return {boolean}
 */
PathUtil.isFileSync = function(path) {
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        return stats.isFile();
    }
    return false;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = PathUtil;
