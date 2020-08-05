const { series, parallel, src, dest, watch } = require('gulp');

/* Gulp Plugin */
const fileInclude = require('gulp-file-include'),
    scss = require('gulp-sass'),
    concat = require('gulp-concat'),
    autoprefixer = require('gulp-autoprefixer'),
    minifyCSS = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    minifyJS = require('gulp-minify'),
    babel = require('gulp-babel'),
    spritesmith = require('gulp.spritesmith'),
    browserSync = require('browser-sync'),
    gCached = require('gulp-cached'),
    merge = require('merge-stream'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify');

/* Path */
const path = {
    css: {
        src: 'public/scss/**',
        dest: 'static/css/'
    },
    javascript: {
        src: 'public/js/**',
        dest: 'static/js'
    },
    imgSprite: {
        src: 'public/img/sprite/*.png',
        dest: 'static/img/sprite',
        css_dest: 'public/scss/helpers'
    }
};

/* Error Handeler Function */
function onError(err) {
    notify.onError({
        message: err, 
        notifier: function(options, callback) {
            console.log('title:', option.title);
            console.log('message:', option.message);
        }
    })(err);
    this.emit('end');
}

function css(cb) {
    return new Promise( resolve => {
        var scssOptions = {
            outputStyle: 'expanded',
            indentType: 'tab',
            indentWidth: 1,
            precision: 6,
            sourceComments: false
        };
    
        src(path.css.src, { sourcemaps: true })
            .pipe(plumber({ errorHandler: onError }))
            // .pipe(gCached('css'))
            .pipe(scss(scssOptions))
            // .pipe(concat('style.css'))      // 컴파일 된 일반 CSS 
            // .pipe(autoprefixer())
            // .pipe(dest('css/'))
            .pipe(minifyCSS())
            .pipe(autoprefixer())
            .pipe(concat('style.min.css'))  // 컴파일 된 압축 CSS 
            .pipe(plumber.stop())
            .pipe(dest(path.css.dest, { sourcemaps: true }))

        resolve();
    });
}

function javascript(cb) {
    return src(path.javascript.src, { sourcemaps: true })
        .pipe(plumber({ errorHandler: onError }))
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(minifyJS({
            ext: {
                // src: '-debug.js',
                min: '.js'
            }
        }))
        .pipe(plumber.stop())
        .pipe(dest(path.javascript.dest))
}

function imgSprite() {
    const spriteData = src(path.imgSprite.src).pipe(
        spritesmith({
            imgPath: '../../static/img/sprite/sprite.png',
            imgName: 'sprite.png',
            cssName: '_sprite.scss'
        })
    );

    const imgStream = spriteData.img.pipe(dest(path.imgSprite.dest));
    const cssStream = spriteData.css.pipe(dest(path.imgSprite.css_dest));
     
    return merge(imgStream, cssStream);
}

function watchs() {
    return new Promise( resolve => {
        watch('templates/*.html').on('change', browserReload);
        watch(path.css.src, css).on('change', browserReload);
        watch(path.javascript.src, javascript).on('change', browserReload);

        resolve();
    });
}

function browserReload() {
    browserSync.reload();
}

/* Local Web Server */
function gulpBrowserSync() {
    return browserSync.init({
        server: {
            baseDir: "templates",
            index: 'index.html'
        },
        serveStatic: ['.', '../static/']
    });
}

exports.default = series(css, javascript, imgSprite, watchs, gulpBrowserSync);
