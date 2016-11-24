'use strict';
const gulp = require('gulp');
const rollup = require('rollup').rollup;
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const _uglify = require('uglify-js').uglify;
const minify = require('uglify-js').minify;
var source = require('vinyl-source-stream');


var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var rename = require('gulp-rename');


var gutil = require('gulp-util');
var size = require('gulp-size');

var path = require('path');
var fs = require('fs');
var wrap = require('gulp-wrap');

gulp.task('default',["css","hbs","Picker"], function() {
});
gulp.task('Picker', function() {
    return rollup({
        entry: './plugins/Picker.js',
        external: [
            './libs/Guppy.js', 'handlebars/runtime'
        ],
        plugins: [nodeResolve({
                jsnext: true
            }),
            commonjs(),
            babel({
                exclude: ['node_modules/**']
            }),
            uglify({
                compress: {
                    screw_ie8: false
                },
                mangle: {
                    screw_ie8: false
                }
            }, _uglify)
        ]
    }).then(function(bundle) {
        return bundle.write({
            globals: {
                './libs/Guppy.js': 'Guppy',
                'handlebars/runtime':'Handlebars'
            },
            moduleName: "Picker",
            format: 'umd',
            dest: './dist/Picker.js'
        });
    });
});
gulp.task('css', function() {
    var postcss = require('gulp-postcss');
    var cssModules = require('postcss-modules');
    var distDir = './dist/css';
    var JsonDir = './build/localScopeJson';

    function getJSONFromCssModules(cssFileName, json) {
        var cssName = path.basename(cssFileName,'.css');
        var jsFileName = path.resolve(JsonDir,cssName+'.js');
        var jsonFileName = path.resolve(JsonDir,cssName+'.json');
        fs.writeFileSync(jsonFileName, JSON.stringify(json));
        fs.writeFileSync(jsFileName, "module.exports="+JSON.stringify(json)+";");
    }
    function getClass(module, className){
        var moduleFileName = path.resolve(distDir, module + '.js');
        var classNames = fs.readFileSync(moduleFileName).toString();
        return JSON.parse(classNames)[className];
    }

    return gulp.src('src/css/**/[^_]*.css')
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(postcss([require('autoprefixer'), require('precss')]))
        .on('error', gutil.log)
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(distDir));
});
gulp.task('hbs', function(){
    var handlebars = require('handlebars'),
            map = require('vinyl-map');
    gulp.src('src/hbs/**/*.hbs')
    .pipe(buffer())
    .pipe(map(function(contents) {
        return handlebars.precompile(contents.toString());
    }))
        .on('error', gutil.log)
    .pipe(wrap('module.exports=<%= contents %>;'))
    .pipe(rename({ extname: '.js' }))
    .pipe(gulp.dest('./build/hbs'));
});
