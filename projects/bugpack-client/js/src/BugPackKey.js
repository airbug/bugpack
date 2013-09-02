//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackKey = function(key) {

    /**
     * @private
     * @type {string}
     */
    this.key = key;

    var keyParts = key.split('.');
    var packageName = ".";
    var exportName = keyParts.pop();
    if (keyParts.length > 0) {
        packageName = keyParts.join('.');
    }

    /**
     * @private
     * @type {string}
     */
    this.exportName = exportName;

    /**
     * @private
     * @type {String}
     */
    this.packageName = packageName;
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackKey.prototype.getKey = function() {
    return this.key;
};

/**
 * @return {string}
 */
BugPackKey.prototype.getExportName = function() {
    return this.exportName;
};

/**
 * @return {string}
 */
BugPackKey.prototype.getPackageName = function() {
    return this.packageName;
};

/**
 * @return {boolean}
 */
BugPackKey.prototype.isWildCard = function() {
    return (this.exportName === "*");
};

