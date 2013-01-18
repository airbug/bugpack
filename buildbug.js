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
var parallel = buildbug.parallel;
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
    bugpackNode : {
        packageJson: {
            name: "bugpack",
            version: "0.0.3",
            main: "./lib/BugPackApi.js",
            private: true
        },
        sourcePaths: [
            "./projects/bugpack-node/js/src"
        ]
    },
    bugpackRegistry : {
        packageJson: {
            name: "bugpack-registry",
            version: "0.0.1",
            main: "./lib/BugPackRegistryBuilder.js",
            private: true
        },
        sourcePaths: [
            "./projects/bugpack-registry/js/src"
        ]
    }
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
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperties().bugpackNode.packageJson,
                        sourcePaths: buildProject.getProperties().bugpackNode.sourcePaths
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperties().bugpackNode.packageJson.name,
                        packageVersion: buildProject.getProperties().bugpackNode.packageJson.version
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: "node_modules"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperties().bugpackNode.packageJson.name,
                            buildProject.getProperties().bugpackNode.packageJson.version);
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
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperties().bugpackRegistry.packageJson,
                        sourcePaths: buildProject.getProperties().bugpackRegistry.sourcePaths
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperties().bugpackRegistry.packageJson.name,
                        packageVersion: buildProject.getProperties().bugpackRegistry.packageJson.version
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: "node_modules"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperties().bugpackRegistry.packageJson.name,
                            buildProject.getProperties().bugpackRegistry.packageJson.version);
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
        ])
    ])
).makeDefault();
