const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const cleanCSS = require("gulp-clean-css");
const terser = require("gulp-terser");
const browserSync = require("browser-sync").create();
// const { deleteAsync } = require("rimraf");
const plumber = require("gulp-plumber");
const gulpIf = require("gulp-if");
const fs = require("fs");
const isProd = process.env.NODE_ENV === "production";

const paths = {
  html: { src: "src/**/*.html", dest: "dist/" },
  styles: { src: "src/scss/**/*.scss", dest: "dist/assets/css/" },
  scripts: { src: "src/js/**/*.js", dest: "dist/assets/js/" },
  images: { src: "src/assets/img/**/*", dest: "dist/assets/img/" },
};

function images() {
  return src(paths.images.src, { encoding: false })
    .pipe(dest(paths.images.dest))
    .pipe(browserSync.stream());
}

function clean() {
  return fs.promises.rm("dist", { recursive: true, force: true });
}

function html() {
  return src(paths.html.src).pipe(dest(paths.html.dest)).pipe(browserSync.stream());
}

function styles() {
  return src(paths.styles.src)
    .pipe(plumber())
    .pipe(gulpIf(!isProd, sourcemaps.init()))
    .pipe(sass.sync({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpIf(isProd, cleanCSS({ level: 2 })))
    .pipe(gulpIf(!isProd, sourcemaps.write(".")))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(paths.scripts.src)
    .pipe(plumber())
    .pipe(gulpIf(isProd, terser()))
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

function serve() {
  browserSync.init({
    server: {
      baseDir: "dist",
      routes: {
        "/assets": "dist/assets",
      },
    },
    notify: false,
    open: false,
  });

  watch(paths.html.src, html);
  watch(paths.styles.src, styles);
  watch(paths.scripts.src, scripts);
  watch(paths.images.src, images);
}

const build = series(clean, parallel(html, styles, scripts, images));

exports.clean = clean;
exports.build = build;
exports.dev = series(build, serve);
exports.default = exports.dev;
exports.images = images;
