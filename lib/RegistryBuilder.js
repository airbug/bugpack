//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var RegistryBuilder = function() {};

/**
 * @param {string} absoluteSourceRoot
 * @param {function()} callback
 */
RegistryBuilder.prototype.build = function(absoluteSourceRoot, callback) {
    var newRegistry = {};
    var sourceFileArray = this.scanDirectoryForSourceFiles(absoluteSourceRoot, true);
    var numberComplete = 0;
    sourceFileArray.forEach(function(sourceFile) {
        var childProcess = child_process.fork(__dirname + '/registry_builder_child_boot.js');
        childProcess.on('message', function(message) {
            numberComplete++;
            var err = null;
            if (message.packName) {
                var packName = message.packName;
                var pack = {
                    name: packName,
                    path: path.relative(absoluteSourceRoot, sourceFile)
                };
                if (message.options) {
                    pack.options = message.options;
                }
                newRegistry[packName] = pack;
            } else {
                err = new Error("JS file '" + sourceFile + "' did not declare a pack name");
            }
            if (err) {
                callback(err, null);
            }
            if (numberComplete === sourceFileArray.length) {
                callback(null, newRegistry);
            }
        });
        childProcess.send({sourceFile: sourceFile});
    });
};

/**
 * @param {string} directoryPathString
 * @param {boolean} scanRecursively (defaults to true)
 * @return {Array<string>}
 */
RegistryBuilder.prototype.scanDirectoryForSourceFiles = function(directoryPathString, scanRecursively) {
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
                var childModulePathArray = this.scanDirectoryForSourceFiles(pathString);
                sourcePathArray = sourcePathArray.concat(childModulePathArray);
            }
        } else if (stat.isFile()) {
            if (pathString.lastIndexOf('.js') === pathString.length - 3) {
                sourcePathArray.push(pathString);
            }
        }
    }
    return sourcePathArray;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = RegistryBuilder;
