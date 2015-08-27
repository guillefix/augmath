{exec} = require 'child_process'

task 'configure', 'Set up working directory to compile Coffeequate', ->
    exec 'npm install requirejs coffee-script almond', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr

task 'build', 'Build project from src/*.coffee to lib/*.js', ->
    exec 'coffee --compile --output lib/ src/', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr

task 'compile', 'Compile project from lib/*.js to coffeequate.min.js', ->
    exec 'node ./node_modules/requirejs/bin/r.js -o build.js', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr

task 'all', 'Build and compile Coffeequate to coffeequate.min.js', ->
    exec 'coffee --compile --output lib/ src/', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        exec 'node ./node_modules/requirejs/bin/r.js -o build.js', (err, stdout, stderr) ->
            throw err if err
            console.log stdout + stderr