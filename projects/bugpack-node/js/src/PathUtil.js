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
 * @private
 * @param {string} path
 */
PathUtil.isDirectorySync = function(path) {
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        return stats.isDirectory();
    }
    return false;
};

/**
 * @private
 * @param {string} path
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
