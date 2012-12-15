//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var RegistryBuilder = require('./RegistryBuilder');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPack = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

/**
 * @private
 * @type {Object}
 */
BugPack.loadedPacks = {};

/**
 * @private
 * @type {Object}
 */
BugPack.loadedRegistryFiles = {};

/**
 * @private
 * @type {boolean}
 */
BugPack.registryLoaded = false;

/**
 * @private
 * @type {Object}
 */
BugPack.registeredPacks = {};

/**
 * @private
 * @type {boolean}
 */
BugPack.registryBuilding = false;

/**
 * @private
 * @type {Array<string>}
 */
BugPack.requireStack = [];


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} sourceRoot
 * @param {function()} callback
 */
BugPack.buildRegistry = function(sourceRoot, callback) {
    var registryBuilder = new RegistryBuilder(sourceRoot);
    registryBuilder.build(callback);
};

/**
 * @param {*} pack
 */
BugPack.export = function(pack) {
    var packName = BugPack.requireStack[BugPack.requireStack.length - 1];
    BugPack.loadedPacks[packName] = pack;
};

/**
 * @param {string} packName
 * @return {*}
 */
BugPack.require = function(packName) {
    if (!BugPack.hasPackLoaded(packName)) {

        // NOTE BRN: We put this check within the hasPackLoaded check. This way files that are concatenated together can
        // retrieve classes without ever retrieving the registry. This is primarily require for client side files.

        if (!BugPack.registryLoaded) {
            BugPack.loadRegistrySync();
            BugPack.autoloadPacksSync();
        }
        BugPack.loadPackSync(packName);
    }
    return BugPack.loadedPacks[packName];
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @private
 */
BugPack.autoloadPacksSync = function() {
    for (var packName in BugPack.registeredPacks) {
        var bugPackRegistrationOptions = BugPack.registeredPacks[packName].options;
        if (bugPackRegistrationOptions && bugPackRegistrationOptions.autoload) {
            BugPack.loadPackSync(packName);
        }
    }
};

/**
 * @private
 * @return {Array<string>}
 */
BugPack.discoverRegistryFilesSync = function() {
    var nodeModuleDirs = [];
    var currentModuleDir = BugPack.findModuleTopDir(module);
    var mainModuleDir = BugPack.findModuleTopDir(require.main);
    var userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var userHomeNodeModulesDir = userHome + "/.node_modules";
    var userHomeNodeLibraries = userHome + "/.node_libraries";
    var nodePath = process.env.NODE_PATH;

    if (nodePath) {
        var nodePathEntries = nodePath.split(":");
        nodePathEntries.forEach(function(nodePathEntry) {
            nodeModuleDirs = nodeModuleDirs.concat(BugPack.findNodeModuleDirsSync(nodePathEntry));
        });
    }

    nodeModuleDirs = nodeModuleDirs.concat(
        BugPack.findNodeModuleDirsSync(currentModuleDir),
        BugPack.findNodeModuleDirsSync(mainModuleDir),
        BugPack.findNodeModuleDirsSync(userHomeNodeLibraries),
        BugPack.findNodeModuleDirsSync(userHomeNodeModulesDir)
    );

    return BugPack.findRegistryFilePathsSync(nodeModuleDirs);
};

/**
 * @private
 * @param module
 * @return {string}
 */
BugPack.findModuleTopDir = function(module) {
    var moduleDir =  path.dirname(module.filename);
    var parts = moduleDir.split(path.sep);
    for (var size = parts.length, i = size - 1; i > 0; i--) {
        var dir = parts.slice(0, i + 1).join(path.sep);
        if (BugPack.isNodeModuleDirSync(dir)) {
            return dir;
        }
    }
    return moduleDir;
};

/**
 * @private
 * @param {string} startDir
 * @return {Array<string>}
 */
BugPack.findNodeModuleDirsSync = function(startDir) {
    var nodeModuleDirs = [];
    if (BugPack.isNodeModuleDirSync(startDir)) {
        nodeModuleDirs.push(startDir);
    }
    var nodeModulesDir = startDir + "/node_modules";
    if (BugPack.isDirectorySync(nodeModulesDir)) {
        var dirList = fs.readdirSync(nodeModulesDir);
        dirList.forEach(function(dirItem) {
            var moduleDir = nodeModulesDir + "/" + dirItem;
            if (BugPack.isDirectorySync(moduleDir)) {
                nodeModuleDirs = nodeModuleDirs.concat(BugPack.findNodeModuleDirsSync(moduleDir));
            }
        });
    }
    return nodeModuleDirs;
};

/**
 * @private
 * @param {Array<string>} nodeModuleDirs
 * @return {Array<string>}
 */
BugPack.findRegistryFilePathsSync = function(nodeModuleDirs) {
    var _this = this;
    var registryFilePaths = [];
    nodeModuleDirs.forEach(function(nodeModuleDir) {
        var possibleRegistryFilePath = nodeModuleDir + "/bugpack-registry.json";
        if (fs.existsSync(possibleRegistryFilePath)) {
            if (!_this.loadedRegistryFiles[possibleRegistryFilePath]) {
                _this.loadedRegistryFiles[possibleRegistryFilePath] = possibleRegistryFilePath;
                registryFilePaths.push(possibleRegistryFilePath);
            }
        }
    });
    return registryFilePaths;
};

/**
 * @private
 * @param {string} packName
 * @return {boolean}
 */
BugPack.hasPackLoaded = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.loadedPacks, packName);
};

/**
 * @private
 * @param {string} packName
 * @return {boolean}
 */
BugPack.hasPackRegistered = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.registeredPacks, packName);
};

/**
 * @private
 * @param {string} path
 */
BugPack.isDirectorySync = function(path) {
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
BugPack.isFileSync = function(path) {
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        return stats.isFile();
    }
    return false;
};

/**
 * @private
 * @param {string} path
 */
BugPack.isNodeModuleDirSync = function(path) {
    return (BugPack.isFileSync(path + "/bugpack-registry.json")
        || BugPack.isFileSync(path + "/package.json")
        || BugPack.isDirectorySync(path + "/node_modules")
        || BugPack.isFileSync(path + "/index.node")
        || BugPack.isFileSync(path + "/index.js"));
};

/**
 * @private
 * @param {string} packName
 * @param {function()} callback
 */
BugPack.loadPack = function(packName, callback) {
    if (BugPack.hasPackRegistered(packName)) {
        var bugPackRegistration = BugPack.registeredPacks[packName];
        setTimeout(function() {
            require(bugPackRegistration.registryPath + "/" + bugPackRegistration.path);
            callback();
        }, 0);
    }
    throw new Error("Unknown bug pack '" + packName + "'");
};

/**
 * @private
 * @param {string} packName
 */
BugPack.loadPackSync = function(packName) {
    if (BugPack.hasPackRegistered(packName)) {
        if (BugPack.requireStack.indexOf(packName) !== -1) {
            throw new Error("Circular dependency in require calls. Requiring '" + packName + "' which is already in the require stack. " + JSON.stringify(BugPack.requireStack));
        }
        BugPack.requireStack.push(packName);
        var bugPackRegistration = BugPack.registeredPacks[packName];
        require(bugPackRegistration.registryPath + "/" + bugPackRegistration.path);
        BugPack.requireStack.pop();
        return;
    }
    throw new Error("Unknown bug pack '" + packName + "'");
};

/**
 * @private
 * @param {function()} callback
 */
BugPack.loadRegistry = function(callback) {
    //TODO BRN
};

/**
 * @private
 */
BugPack.loadRegistrySync = function() {
    var _this = this;
    BugPack.registryLoaded = true;
    var registryFilePaths = BugPack.discoverRegistryFilesSync();
    if (registryFilePaths.length > 0) {
        registryFilePaths.forEach(function(registryFilePath) {
            var registryContents = fs.readFileSync(registryFilePath, "utf8");
            var registryPath = path.dirname(registryFilePath);
            var registryPacks = JSON.parse(registryContents);
            for (var packName in registryPacks) {
                var registryPack = registryPacks[packName];
                if (_this.registeredPacks[packName]) {
                    throw new Error("Duplicate pack name '" + packName + "'");
                }
                registryPack.registryPath = registryPath;
                _this.registeredPacks[packName] = registryPack;
            }
        });
    } else {
        throw new Error("Registry file could not be found");
    }
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPack;
