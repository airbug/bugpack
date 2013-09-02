//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackLibrary = function() {

    /**
     * @private
     * @type {Object}
     */
    this.packages = {};
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} packageName
 * @return {BugPackPackage}
 */
BugPackLibrary.prototype.createPackage = function(packageName) {
    var corePackage = this.getPackage("");
    if (!corePackage) {
        corePackage = new BugPackPackage("");
        this.packages[corePackage.getName()] = corePackage;
    }

    var _this = this;
    var packageParts = packageName.split(".");
    var currentPackageString = "";
    var first = true;
    var parentPackage = corePackage;
    packageParts.forEach(function(packagePart) {
        if (first) {
            first = false;
        } else {
            currentPackageString += ".";
        }
        currentPackageString += packagePart;
        if (!_this.hasPackage(currentPackageString)) {
            var bugPackPackage = new BugPackPackage(currentPackageString);
            _this.packages[bugPackPackage.getName()] = bugPackPackage;
            parentPackage.addSubPackage(bugPackPackage);
            parentPackage = bugPackPackage;
        }
    });
};

/**
 * @param {string} packageName
 * @return {BugPackPackage}
 */
BugPackLibrary.prototype.getPackage = function(packageName) {
    if (this.hasPackage(packageName)) {
        return this.packages[packageName];
    }
    return undefined;
};

/**
 * @param {string} packageName
 * @return {boolean}
 */
BugPackLibrary.prototype.hasPackage = function(packageName) {
    return Object.prototype.hasOwnProperty.call(this.packages, packageName);
};

/**
 * @param {string} packageName
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackLibrary.prototype.registerExport = function(packageName, exportName, bugPackExport) {
    var bugPackPackage = this.getPackage(packageName);
    if (!bugPackPackage) {
        bugPackPackage = this.createPackage(packageName);
    }
    bugPackPackage.export(exportName, bugPackExport);
};
