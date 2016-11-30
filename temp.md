var configs = [
  require('./gulpconfig.js')
];
var
  gulp = require('gulp'),
  //plugins
  sass = require('gulp-sass'),
  minifycss = require('gulp-minify-css'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  autoprefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  notify = require('gulp-notify'),
  spritesmith = require('gulp.spritesmith'),
  clean = require('gulp-clean');

//考虑多个项目同时监听
configs.forEach(function (config, i) {
  var
    prefixerVersion = config.prefixerVersion,
    PATH = config.path;

  var cleans = configs.map(function (val, index) {
    return `clean${index}`;
  });

  if (i === configs.length - 1) {
    gulp.task('default', cleans, function () {
      for (let j = 0; j < configs.length; j++)
        gulp.start(`watch${j}`);
    });
  }

  gulp.task(`sassBase${i}`, function () {
    //scss base
    return gulp.src(PATH.sass_base.src)
      .pipe(sourcemaps.init({debug: true}))
      .pipe(sass({
        outputStyle: 'expanded'
      }).on('error', sass.logError)) //nested, expanded, compact, compressed
      .pipe(autoprefixer({
        browsers: prefixerVersion,
        cascade: true, //是否美化属性值 默认：true
        remove: false //是否去掉不必要的前缀 默认：true
      }))

      //.pipe(spriter(config.spriteSheetConfig))
      .pipe(gulp.dest(PATH.sass_base.dest))

      .pipe(minifycss())
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(sourcemaps.write('.'))

      .pipe(gulp.dest(PATH.sass_base.dest))
      .pipe(notify({
        message: 'base css task ok'
      }));
  });

  gulp.task(`js_depend${i}`, function () {
    return gulp.src(PATH.js_depend.src)
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(concat('ucd.js'))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(PATH.js_depend.dest))
      .pipe(notify({
        message: 'js_depend task ok'
      }));
  });

  gulp.task(`js_widgets${i}`, function () {
    return gulp.src(PATH.js_widgets.src)
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(concat('ucd.widgets.js'))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(PATH.js_widgets.dest))
      .pipe(notify({
        message: 'js_widgets task ok'
      }));
  });
  gulp.task(`sprite${i}`, function () {
    var spriteData = gulp.src(PATH.sprite.src).pipe(spritesmith(config.spriteSmithConfig));
    return spriteData.pipe(gulp.dest(PATH.sprite.dest))
      .pipe(notify({
        message: 'sprite task ok'
      }));
  });

  gulp.task(`clean${i}`, function () {
    return gulp.src(PATH.clean).pipe(clean());
  });

  gulp.task(`watch${i}`, [`sprite${i}`, `sassBase${i}`, `js_depend${i}`, `js_widgets${i}`], function () {
    var sassBaseWatcher = gulp.watch(PATH.sass_base.src.concat(PATH.sass_watching), [`sassBase${i}`]);
    var jsWatcher = gulp.watch(PATH.js_depend.src.concat(PATH.js_watching), [`js_depend${i}`]);
    var jsvendorsWatcher = gulp.watch(PATH.js_widgets.src.concat(PATH.js_watching), [`js_widgets${i}`]);
    var spriteWatcher = gulp.watch(PATH.sprite.src, [`sprite${i}`, `sassBase${i}`]);
  });

  gulp.task(`build${i === 0 ? '' : i + 1}`, [`clean${i}`,`sprite${i}`, `sassBase${i}`, `js_depend${i}`, `js_widgets${i}`], function () {
    return gulp.src(PATH.build.src, {base: '.'})
      .pipe(gulp.dest(PATH.build.dest));
  });

});
