const child_process = require("child_process");
const fs = require("fs");

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;

  grunt.initConfig({
    pkg: pkg,

    copy: {
      release: {
        files: [
          {expand: true, cwd: 'extension', src: '*', dest: 'extension-dist/', filter: 'isFile'},
          {expand: true, cwd: 'icons/release-extension', src: '*', dest: 'extension-dist/', filter: 'isFile'},
        ],
      },
      beta: {
        files: [
          {expand: true, cwd: 'extension', src: '*', dest: 'extension-dist/', filter: 'isFile'},
          {expand: true, cwd: 'icons/beta-extension', src: '*', dest: 'extension-dist/', filter: 'isFile'},
        ],
      }
    },

    compress: {
      // Zip up the extension
      chrome: {
        options: {
          archive: 'extension-dist/chrome.zip'
        },
        files: [{
          expand: true,
          cwd: 'extension-dist',
          src: [
            '**',
            '!data',
            '!chrome.zip',
            '!.htaccess',
            '!stats.html',
            'README.md'
          ],
          dest: '/',
          filter: 'isFile'
        }, ]
      }
    },

    // See https://github.com/c301/grunt-webstore-upload
    webstore_upload: {
      accounts: {
        // This is set up by environment variables from Travis. To
        // push locally, create a file with these variables defined
        // and source it before running "grunt publish:beta". E.g.:
        //
        // ./beta_credentials:
        //
        // export CHROME_CLIENT_ID="foo"
        // export CHROME_SECRET="bar"
        // export CHROME_REFRESH_TOKEN="baz"
        //
        // Then run "source ./beta_credentials; grunt publish_chrome_beta"
        default: { //account under this section will be used by default
          publish: true, //publish item right after uploading. default false
          client_id: process.env.CHROME_CLIENT_ID,
          client_secret: process.env.CHROME_SECRET,
          refresh_token: process.env.CHROME_REFRESH_TOKEN
        }
      },
      extensions: {
        release: {
          appID: "apghicjnekejhfancbkahkhdckhdagna",
          zip: "extension-dist/chrome.zip"
        },
        beta: {
          appID: "mkiipknpfaacbjdagdeppdacpgpdjklc",
          zip: "extension-dist/chrome.zip"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-copy');

  function rewrite(dist) {
    var manifest = grunt.file.readJSON('extension-dist/manifest.json');
    if (dist === 'beta') {
      manifest.name = 'Destiny Item Manager Beta Shortcut';
    }

    grunt.file.write('extension-dist/manifest.json', JSON.stringify(manifest));
    var mainjs = grunt.file.read('extension-dist/main.js');
    mainjs = mainjs.replace('localhost:8080', `${dist}.destinyitemmanager.com`);
    grunt.file.write('extension-dist/main.js', mainjs);
  }

  grunt.registerTask('update_chrome_beta_manifest', function() {
    rewrite('beta');
  });

  grunt.registerTask('update_chrome_release_manifest', function() {
    rewrite('app');
  });

  grunt.registerTask('publish_beta_extension', [
    'copy:beta',
    'update_chrome_beta_manifest',
    'compress:chrome',
    'webstore_upload:beta'
  ]);

  grunt.registerTask('publish_release_extension', [
    'copy:release',
    'update_chrome_release_manifest',
    'compress:chrome',
    'webstore_upload:release'
  ]);
};
