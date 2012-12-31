//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug = require("buildbug");


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject = buildbug.buildProject;
var buildProperties = buildbug.buildProperties;
var buildTarget = buildbug.buildTarget;
var enableModule = buildbug.enableModule;
var series = buildbug.series;
var targetTask = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws = enableModule("aws");
var core = enableModule("core");
var nodejs = enableModule("nodejs");


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    packageJson: {
        "name": "bugpack",
        "version": "0.0.2",
        "main": "./lib/BugPackNode.js",
        "private": true
    },
    sourcePaths: [
        "./projects/bugpack-node/js/src"
    ]
});


//-------------------------------------------------------------------------------
// Declare Tasks
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Declare Flows
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);

buildTarget("local").buildFlow(
    series([

        // TODO BRN: This "clean" task is temporary until we"re not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask("clean"),

        targetTask("createNodePackage", {
            properties: {
                packageJson: buildProject.getProperties().packageJson,
                sourcePaths: buildProject.getProperties().sourcePaths
            }
        }),
        targetTask("packNodePackage", {
            properties: {
                packageName: buildProject.getProperties().packageJson.name,
                packageVersion: buildProject.getProperties().packageJson.version
            }
        }),
        targetTask("s3EnsureBucket", {
            properties: {
                bucket: "node_modules"
            }
        }),
        targetTask("s3PutFile", {
            init: function(task, buildProject, properties) {
                var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperties().packageJson.name,
                    buildProject.getProperties().packageJson.version);
                task.updateProperties({
                    file: packedNodePackage.getFilePath(),
                    options: {
                        ACL: 'public-read'
                    }
                });
            },
            properties: {
                bucket: "node_modules"
            }
        })
    ])
).makeDefault();
