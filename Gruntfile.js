module.exports = function(grunt){

  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {    
      js: {
        files: ['lib/**/*.js'],
        tasks: ['uglify']
      },
      html: {
        files: ['example/index.html'],
        tasks: ['htmlhint']
      },
      //run unit tests with karma (server needs to be already running)
      karma: {
        files: ['lib/**/*.js', 'tests/**/*.js'],//['app/js/**/*.js', 'test/browser/**/*.js'],
        exclude: ['tests/*.conf.js'],
        tasks: ['karma:unit:run'] //NOTE the :run flag
      }
    },

    htmlhint: {
      build: {
        options: {
          'tag-pair': true,
          'tagname-lowercase': true,
          'attr-lowercase': true,
          'attr-value-double-quotes': true,
          'doctype-first': true,
          'spec-char-escape': true,
          'id-unique': true,
          'head-script-disabled': true,
          'style-disabled': true
        },
        src: ['example/index.html']
      }
    },

    uglify: {
      build: {
        files: {
          'build/pit-lib.min.js': [
             'lib/pitControls/*.js'
            ,'lib/pitControls/services/*.js'
            ,'lib/pitControls/directives/*.js'
          ]
        }
      }
    },

    karma: {
      unit: {
        configFile: 'tests/run.conf.js',
        background: true
      }
    }
  });

  grunt.registerTask('default', []);

};