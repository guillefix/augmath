({
    baseUrl: 'lib/',
    mainConfigFile: 'lib/coffeequate.js',
 
    out: 'coffeequate.min.js',
    optimize: 'uglify2',
 
    include: ['coffeequate'],
    name: '../node_modules/almond/almond',

    wrap: {
        startFile: "src/start.frag",
        endFile: "src/end.frag"
    }
})