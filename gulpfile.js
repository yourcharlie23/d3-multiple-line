var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
// var browserSync = require('browser-sync').create();
var del = require('del');
var minify = require('gulp-minify');
var src = './src';

// BrowserSync update page every time there is change. It needs to know the path it served.
// gulp.task('browserSync', function() {
//   browserSync.init({
//     proxy: "localhost:5000/dist/"
//   });
// })

gulp.task('sass', function () {
  // gulp.src locates the source files for the process.
  // This globbing function tells gulp to use all files
  // ending with .scss or .sass within the scss folder.
  gulp.src('./src/**/*.{scss,sass}')
    // Initializes sourcemaps
    .pipe(sourcemaps.init())
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: 'compressed'
      }))
    // Writes sourcemaps into the CSS file
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'));
    // .pipe(browserSync.reload({
    //   stream: true
    // }));
})

gulp.task('copyimg', function() {
  return gulp.src('./src/**/*/img/**/*')
  .pipe(gulp.dest('./dist'));
  // .pipe(browserSync.reload({
  //   stream: true
  // }));
})

gulp.task('copyfonts', function() {
  return gulp.src('./src/**/*/fonts/**/*')
  .pipe(gulp.dest('./dist'));
  // .pipe(browserSync.reload({
  //   stream: true
  // }));
})

gulp.task('compressjs', function() {
  gulp.src(['./src/**/*/js/**/*', './src/**/*/vendor/**/*'])
    .pipe(sourcemaps.init())
    .pipe(minify({
      ext:{
        min:'.js'
      },
      compress: true,
      noSource: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'));
    // .pipe(browserSync.reload({
    //   stream: true
    // }));
});

gulp.task('copypage', function() {
  return gulp.src('./src/**/*.html')
  .pipe(gulp.dest('./dist'));
  // .pipe(browserSync.reload({
  //   stream: true
  // }));
})

gulp.task('copydata', function() {
  return gulp.src('./src/**/*.csv')
  .pipe(gulp.dest('./dist'));
  // .pipe(browserSync.reload({
  //   stream: true
  // }));
})

gulp.task('copy', ['copyimg', 'copyfonts', 'compressjs', 'copypage', 'copydata']);

// delete the /dist folder
gulp.task('clean', function() {
  return del.sync('dist');
})

// Watch folders for changes
// gulp.task('watch', ['browserSync', 'sass'], function() {
gulp.task('watch', ['sass'], function() {
  // Watches the scss folder for all .scss and .sass files
  // If any file changes, run the sass task
  gulp.watch('**/*.html', {cwd: src}, ['copypage']);
  gulp.watch('**/*.{scss,sass}', {cwd: src}, ['sass']);
  gulp.watch('**/*.js', {cwd: src}, ['compressjs']);
  gulp.watch('**/*.{jpg, png, jpeg}', {cwd: src}, ['copyimg']);
  gulp.watch('**/*.csv', {cwd: src}, ['copydata']);
})

// Creating a default task
gulp.task('default', [ 'clean', 'sass', 'copy']);


