//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var child_process = require('child_process');
var fs = require('fs');

//TEST
console.log(module.filename);

//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPack = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

BugPack.loadedPacks = {};

BugPack.registry = null;

BugPack.registryBuilding = false;


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

BugPack.buildRegistry = function(sourceRoot) {
    var newRegistry = {};
    var sourceFileArray = scanDirectoryForSourceFiles(sourceRoot, true);
    sourceFileArray.forEach(function(sourceFile) {
        var childProcess = child_process.fork(sourceFile);
        childProcess.on('message', function(message) {
            if (message.packName) {
                var packName = message.packName;
                newRegistry[packName] = sourceFile;
            } else {
                throw new Error("JS file '" + sourceFile + "' did not declare a pack name");
            }
        });
    });
    return newRegistry;
};

BugPack.declare = function(packName) {
    if (BugPack.registryBuilding) {
        process.send(JSON.stringify({
            packName: packName
        }));
        process.exit();
    }
};

BugPack.export = function(packName, pack) {
    BugPack.loadedPacks[packName] = pack;
};

BugPack.hasPackLoaded = function(packName) {
    return Object.prototype.hasOwnProperty.call(BugPack.loadedPacks, packName);
};

BugPack.loadPack = function(packName) {
    if (BugPack.registry === null) {
        BugPack.loadRegistry();
    }
    throw new Error("Unknown bug pack '" + packName + "'");
};

BugPack.loadRegistry = function() {
    //TODO BRN: Try using "require.main.filename" to find the root of the module. Also try "module.filename"
    // If neither of these work, use a similar search pattern as the node js module system. search backwards until the
    // first "node_modules" dir is found.

    //TODO BRN: Load the bugpack-registry.json file which should be located at the root of the module dir /bugpack-registry.json
};

BugPack.require = function(packName) {
    if (BugPack.hasPackLoaded(packName)) {
        return BugPack.loadedPacks[packName];
    } else {
        BugPack.loadPack(packName);
    }
};

/**
 * @param {string} directoryPathString
 * @param {boolean} scanRecursively (defaults to true)
 * @return {Array<string>}
 */
function scanDirectoryForSourceFiles(directoryPathString, scanRecursively) {
    console.log("scanning directory for js files - " + directoryPathString);
    if (scanRecursively === undefined) {
        scanRecursively = true;
    }
    var sourcePathArray = [];
    var fileStringArray = fs.readdirSync(directoryPathString);
    for (var i = 0, size = fileStringArray.length; i < size; i++) {
        var pathString = directoryPathString + "/" + fileStringArray[i];
        var stat = fs.statSync(pathString);
        if (stat.isDirectory()) {
            if (scanRecursively) {
                var childModulePathArray = scanDirectoryForSourceFiles(pathString);
                sourcePathArray.splice(0, 0, childModulePathArray);
            }
        } else if (stat.isFile()) {
            if (pathString.lastIndexOf('.js') === pathString.length - 3) {
                sourcePathArray.push(pathString);
            }
        }
    }
    return sourcePathArray;
}

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPack;
