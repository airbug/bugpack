//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackKey = function(key) {

    var keyParts        = key.split('.');
    var packageName     = "";
    var exportName      = keyParts.pop();
    if (keyParts.length > 0) {
        packageName = keyParts.join('.');
    }

    /**
     * @private
     * @type {string}
     */
    this.exportName     = exportName;

    /**
     * @private
     * @type {string}
     */
    this.key            = key;

    /**
     * @private
     * @type {string}
     */
    this.packageName    = packageName;
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackKey.prototype.getExportName = function() {
    return this.exportName;
};

/**
 * @return {string}
 */
BugPackKey.prototype.getKey = function() {
    return this.key;
};

/**
 * @return {string}
 */
BugPackKey.prototype.getPackageName = function() {
    return this.packageName;
};


//-------------------------------------------------------------------------------
// Convenience Methods
//-------------------------------------------------------------------------------

/**
 * @return {boolean}
 */
BugPackKey.prototype.isWildCard = function() {
    return (this.exportName === "*");
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackKey;
