//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var UrlBugPackScanner = function(url) {

    /**
     * @private
     * @type {string}
     */
    this.url = url;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @return {Array.<BugPackRegistryFile>}
 */
UrlBugPackScanner.prototype.scanForRegistryFiles = function() {
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
