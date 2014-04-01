//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug        = require("buildbug");


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject    = buildbug.buildProject;
var buildProperties = buildbug.buildProperties;
var buildTarget     = buildbug.buildTarget;
var enableModule    = buildbug.enableModule;
var parallel        = buildbug.parallel;
var series          = buildbug.series;
var targetTask      = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws             = enableModule("aws");
var bugpack         = enableModule('bugpack');
var bugunit         = enableModule('bugunit');
var core            = enableModule('core');
var nodejs          = enableModule('nodejs');
var uglifyjs        = enableModule("uglifyjs");


//-------------------------------------------------------------------------------
// Values
//-------------------------------------------------------------------------------

var version         = "0.1.0";


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    bugpackNode: {
        packageJson: {
            name: "bugpack",
            version: version,
            description: "Package loader to help make browser and node js package loading consistent",
            main: "./lib/BugPackApi.js",
            author: "Brian Neisler <brian@airbug.com>",
            repository: {
                type: "git",
                url: "https://github.com/airbug/bugpack.git"
            },
            bugs: {
                url: "https://github.com/airbug/bugpack/issues"
            },
            licenses: [
                {
                    type : "MIT",
                    url : "https://raw.githubusercontent.com/airbug/bugpack/master/LICENSE"
                }
            ]
        },
        sourcePaths: [
            "./projects/bugpack-node/js/src"
        ],
        readmePath: "./README.md"
    },
    bugpackRegistry: {
        packageJson: {
            name: "bugpack-registry",
            version: version,
            description: "Registry builder for the bugpack package loader",
            main: "./scripts/bugpack-registry-module.js",
            author: "Brian Neisler <brian@airbug.com>",
            dependencies: {
                bugpack: 'https://s3.amazonaws.com/deploy-airbug/bugpack-0.0.5.tgz'
            },
            repository: {
                type: "git",
                url: "https://github.com/airbug/bugpack.git"
            },
            bugs: {
                url: "https://github.com/airbug/bugpack/issues"
            },
            licenses: [
                {
                    type : "MIT",
                    url : "https://raw.githubusercontent.com/airbug/bugpack/master/LICENSE"
                }
            ]
        },
        sourcePaths: [
            "../bugcore/projects/bugcore/js/src",
            "../bugjs/projects/buganno/js/src",
            "../bugjs/projects/bugflow/js/src",
            "../bugjs/projects/bugfs/js/src",
            "../bugjs/projects/bugmeta/js/src",
            "../bugjs/projects/bugtrace/js/src",
            "./projects/bugpack-registry/js/src"
        ],
        scriptPaths: [
            "../bugjs/projects/buganno/js/scripts",
            "./projects/bugpack-registry/js/scripts"
        ],
        unitTest: {
            packageJson: {
                name: "bugpack-registry-test",
                version: version,
                main: "./scripts/bugpack-registry-module.js",
                dependencies: {
                    bugpack: 'https://s3.amazonaws.com/deploy-airbug/bugpack-0.0.5.tgz'
                },
                scripts: {
                    test: "node ./scripts/bugunit-run.js"
                }
            },
            sourcePaths: [
                "../bugjs/projects/bugyarn/js/src",
                "../bugunit/projects/bugdouble/js/src",
                "../bugunit/projects/bugunit/js/src"
            ],
            scriptPaths: [
                "../bugunit/projects/bugunit/js/scripts"
            ],
            testPaths: [
                "../bugcore/projects/bugcore/js/test",
                "../bugjs/projects/buganno/js/test",
                "../bugjs/projects/bugflow/js/test",
                "../bugjs/projects/bugmeta/js/test",
                "../bugjs/projects/bugtrace/js/test",
                "./projects/bugpack-registry/js/test"
            ]
        }
    },
    bugpackWeb: {
        name: "bugpack",
        version: "0.1.0",
        sourcePaths: [
            "./projects/bugpack-client/js/src/BugPackKey.js",
            "./projects/bugpack-client/js/src/BugPackPackage.js",
            "./projects/bugpack-client/js/src/BugPackLibrary.js",
            "./projects/bugpack-client/js/src/BugPackSource.js",
            "./projects/bugpack-client/js/src/BugPackRegistryEntry.js",
            "./projects/bugpack-client/js/src/BugPackRegistry.js",
            "./projects/bugpack-client/js/src/BugPackRegistryFile.js",
            "./projects/bugpack-client/js/src/BugPackContext.js",
            "./projects/bugpack-client/js/src/BugPackApi.js"
        ],
        outputFile: "{{distPath}}/{{bugpackWeb.name}}-{{bugpackWeb.version}}.js",
        outputMinFile: "{{distPath}}/{{bugpackWeb.name}}-{{bugpackWeb.version}}.min.js"
    }
});


//-------------------------------------------------------------------------------
// BuildTargets
//-------------------------------------------------------------------------------


// Clean BuildTarget
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);


// Local BuildTarget
//-------------------------------------------------------------------------------

buildTarget("local").buildFlow(

    series([
        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        readmePath: buildProject.getProperty("bugpackNode.readmePath"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackNode.packageJson.name}}",
                        packageVersion: "{{bugpackNode.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{local-bucket}}"
                    }
                })
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths").concat(
                            buildProject.getProperty("bugpackRegistry.unitTest.sourcePaths")
                        ),
                        scriptPaths: buildProject.getProperty("bugpackRegistry.scriptPaths").concat(
                            buildProject.getProperty("bugpackRegistry.unitTest.scriptPaths")
                        ),
                        testPaths: buildProject.getProperty("bugpackRegistry.unitTest.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackRegistry.packageJson.name}}",
                        packageVersion: "{{bugpackRegistry.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{local-bucket}}"
                    }
                })
            ]),
            series([
                targetTask("concat", {
                    properties: {
                        sources: buildProject.getProperty("bugpackWeb.sourcePaths"),
                        outputFile: "{{bugpackWeb.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{bugpackWeb.outputFile}}",
                            options: {
                                acl: 'public-read',
                                gzip: true
                            },
                            bucket: "{{local-bucket}}"
                        }
                    }),
                    series([
                        targetTask("uglifyjsMinify", {
                            properties: {
                                sources: ["{{bugpackWeb.outputFile}}"],
                                outputFile: "{{bugpackWeb.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{bugpackWeb.outputMinFile}}",
                                options: {
                                    acl: 'public-read',
                                    gzip: true
                                },
                                bucket: "{{local-bucket}}"
                            }
                        })
                    ])
                ])
            ])
        ])
    ])
).makeDefault();


// Prod BuildTarget
//-------------------------------------------------------------------------------

buildTarget("prod").buildFlow(
    series([
        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        readmePath: buildProject.getProperty("bugpackNode.readmePath"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackNode.packageJson.name}}",
                        packageVersion: "{{bugpackNode.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{prod-deploy-bucket}}"
                    }
                })
            ]),

            //Create test bugpack-registry package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.unitTest.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths").concat(
                            buildProject.getProperty("bugpackRegistry.unitTest.sourcePaths")
                        ),
                        scriptPaths: buildProject.getProperty("bugpackRegistry.scriptPaths").concat(
                            buildProject.getProperty("bugpackRegistry.unitTest.scriptPaths")
                        ),
                        testPaths: buildProject.getProperty("bugpackRegistry.unitTest.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("bugpackRegistry.unitTest.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{bugpackRegistry.unitTest.packageJson.name}}",
                        packageVersion: "{{bugpackRegistry.unitTest.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("bugpackRegistry.unitTest.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.unitTest.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath(),
                            checkCoverage: true
                        });
                    }
                })
            ]),

            // Create production bugpack-registry package

            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths"),
                        scriptPaths: buildProject.getProperty("bugpackRegistry.scriptPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: "{{bugpackRegistry.packageJson.name}}",
                        packageVersion: "{{bugpackRegistry.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{prod-deploy-bucket}}"
                    }
                })
            ]),
            series([
                targetTask("concat", {
                    properties: {
                        sources: buildProject.getProperty("bugpackWeb.sourcePaths"),
                        outputFile: "{{bugpackWeb.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{bugpackWeb.outputFile}}",
                            options: {
                                acl: 'public-read',
                                gzip: true
                            },
                            bucket: "{{prod-deploy-bucket}}"
                        }
                    }),
                    series([
                        targetTask("uglifyjsMinify", {
                            properties: {
                                sources: ["{{bugpackWeb.outputFile}}"],
                                outputFile: "{{bugpackWeb.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{bugpackWeb.outputMinFile}}",
                                options: {
                                    acl: 'public-read',
                                    gzip: true
                                },
                                bucket: "{{prod-deploy-bucket}}"
                            }
                        })
                    ])
                ])
            ])
        ])
    ])
);

