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
            version: "0.0.4",
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
            version: "0.0.4",
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


// Clean Flow
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);


// Local Flow
//-------------------------------------------------------------------------------

buildTarget("local").buildFlow(

    series([

        // TODO BRN: This "clean" task is temporary until we"re not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperty("bugpackNode.packageJson.name"),
                        packageVersion: buildProject.getProperty("bugpackNode.packageJson.version")
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                })
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperty("bugpackRegistry.packageJson.name"),
                        packageVersion: buildProject.getProperty("bugpackRegistry.packageJson.version")
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                })
            ])
        ])
    ])
).makeDefault();


// Prod Flow
//-------------------------------------------------------------------------------

buildTarget("prod").buildFlow(

    series([

        // TODO BRN: This "clean" task is temporary until we"re not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperty("bugpackNode.packageJson.name"),
                        packageVersion: buildProject.getProperty("bugpackNode.packageJson.version")
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: "airbug"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: "airbug"
                    }
                })
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: buildProject.getProperty("bugpackRegistry.packageJson.name"),
                        packageVersion: buildProject.getProperty("bugpackRegistry.packageJson.version")
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: "airbug"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: "airbug"
                    }
                })
            ])
        ])
    ])
);

