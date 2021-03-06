'use strict';

var gulp = require('gulp');
var gulp_typescript = require('gulp-typescript');
var merge2 = require('merge2');
var gulp_jasmine = require('gulp-jasmine');
var gulp_sourcemaps = require('gulp-sourcemaps');
var gulp_tslint = require('gulp-tslint');
var gulp_concat = require('gulp-concat');
var dts_generator = require('dts-generator');
var run_sequence = require('run-sequence');
var browser_sync = require('browser-sync').create();


//var tslint = require('tslint');
var del = require('del');

//let tsProject = gulp_typescript.createProject('tsconfig.json');
let moduleGeneration = 'umd';
let targetGeneration = 'es5';
let sourcemapsInline = true;



var sourcemapsConfig = null;
if(!sourcemapsInline) //if not inline, then write in file
{
    sourcemapsConfig = '.';
}
 
 gulp.task('browser-sync', function() {
    browser_sync.init({
        server: {
            baseDir: "./dist/dev/js/"
        }
    });
});

 
 
gulp.task('vendors', function() {
    return gulp.src('node_modules/**/*')
    .pipe(gulp.dest('dist/dev/js/node_modules/'));
});

gulp.task('test', function() {
    return run_sequence('test:integration', 'browser-sync');
});
 
gulp.task('test:integration', function() {
    return gulp
    .src('app/**/*.html')
    .pipe(gulp.dest('dist/dev/js/'));
});
 
gulp.task('scripts', ['tslint', 'vendors'], function() {
	let tsResult = gulp.src('app/**/*.ts')
                    .pipe(gulp_sourcemaps.init())
					.pipe(gulp_typescript({module: moduleGeneration, target: targetGeneration, declaration: true, sortOutput: true, removeComments: true}));
  
	return merge2([ // Merge the two output streams, so this task is finished when the IO of both operations are done. 
		tsResult.dts
        .pipe(gulp_sourcemaps.write(sourcemapsConfig))
        .pipe(gulp.dest('dist/dev/definitions')),
		tsResult.js
        .pipe(gulp_sourcemaps.write(sourcemapsConfig))
        .pipe(gulp.dest('dist/dev/js'))
	]);
});
gulp.task('watch', ['scripts'], function() {
    gulp.watch('app/**/*.ts', ['scripts']);
});

gulp.task("tslint", () =>
    gulp.src("app/**/*.ts")
        .pipe(gulp_tslint())
        .pipe(gulp_tslint.report("verbose", {
          emitError: true
        }))
);

gulp.task('clean', function () {
  return del(['dist/']);
});





gulp.task('build', ['build:dev'], function() {
    
  let tsConfigDeclaration = gulp_typescript({module: moduleGeneration, target: targetGeneration, declaration: true, removeComments: true });  
  let tsConfigOneFile = gulp_typescript({module: moduleGeneration, target: targetGeneration, declaration: true, removeComments: true });
  
	return merge2([
        
        gulp.src('app/src/**/*.ts')
                .pipe(gulp_sourcemaps.init())
                .pipe(tsConfigDeclaration)
                .dts
        .pipe(gulp_sourcemaps.write())
        .pipe(gulp.dest('dist/prod/definitions/src'))

        
        ,

		gulp.src('app/src/**/*.ts')
                .pipe(gulp_sourcemaps.init())
                .pipe(tsConfigOneFile)
                .js
        .pipe(gulp_sourcemaps.write())
        .pipe(gulp.dest('dist/prod/js/src'))
	]);
    
});


gulp.task('build:dev', [ 'scripts' ]);

gulp.task('default', function(){
    run_sequence('clean','build');
}
);


// gulp.task('test', ['build'], function() {
//     return gulp
//         .src('dist/dev/js/spec/**/*.js')
//         .pipe(gulp_jasmine());
// });