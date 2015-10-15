#! /usr/bin/env node

var fs = require('fs');
var fixMyJs = require('fixmyjs');
var jshint = require('jshint').JSHINT;
var JSCS = require('jscs');
var clc = require('cli-color');
var checker = new JSCS();

// initializations
var exitCode = 0;
var args = process.argv.slice(2);
var fixFlag = false;
var whiteSpaceFlag = false;
var filePaths;

// find flag arguments, if any
for (var j = 0; j < args.length; j++){
  if (args[j] === '-f') fixFlag = true;
  if (args[j] === '-w') whiteSpaceFlag = true;
}

// parse the filepaths out of the arguments
if ( fixFlag && whiteSpaceFlag ) {
 filePaths = process.argv.slice(2, -2);
} else if ( (fixFlag && !whiteSpaceFlag) || (whiteSpaceFlag && !fixFlag) ) {
  filePaths = process.argv.slice(2, -1);
} else {
  filePaths = process.argv.slice(2);
}

// set the correct config based on the presence/lack of -w flag
if (whiteSpaceFlag) {
  config = require('./config/volt_whitespace.json');
} else {
  config = require('./config/volt_full_lint.json');
}

// initialize linter with rules
checker.registerDefaultRules();
checker.configure(config);

// options object for fixmyjs
var fmjsOptions = {
  camelcase: true,
  plusplus: true,
  curly: true,
  eqeqeq: true,
};

// loop through each filepath in filpaths array and take appropriate
// actions based on the presence/lack of flag arguments
for (var i = 0; i < filePaths.length; i += 1) {

  var rawCode = fs.readFileSync(filePaths[i]).toString();
  var linted = checker.checkString(rawCode);
  var lintErrors = linted.getErrorList();

  // reporter header for each file
  console.log(clc.yellow(clc.white('\nLinting ') + filePaths[i]));
  console.log(clc.blue('***************************************************************'));

  // if "-f" was present in arguments, run the lint and fix operation
  if (fixFlag) {
    var linterFixed = undefined;
    
    if (whiteSpaceFlag) {
      linterFixed = checker.fixString(rawCode, filePaths[i]);
    } else {
      var fmjsFixed = fixMyJs.fix(rawCode, fmjsOptions);
      linterFixed = checker.fixString(fmjsFixed, filePaths[i]);
    }

    // run auto fix if we have lint errors
    if (lintErrors.length > 0) {

      if (linterFixed && linterFixed.output.length > 0) {
        autoFix(filePaths[i], linterFixed.output);
      }

      var postFixLinted = checker.checkString(linterFixed.output);
      var postFixLintErrors = postFixLinted.getErrorList();

      // re-lint after auto fixing and see if we have remaining errors
      if (postFixLintErrors.length > 0){
        exitCode = 1;
        
        for (var n = 0; n < postFixLintErrors.length; n += 1) {
          var colorizedOutput = true;
          console.log(clc.green("Remaining errors after autofix----------------"));
          console.log(linted.explainError(postFixLintErrors[n], colorizedOutput) + '\n');
        }
      }
    } else {
      console.log(clc.greenBright('No lintable errors!  ' + clc.yellowBright('d=(´▽ `)=b\n')));
    }
  } else {
    if (lintErrors.length > 0){
      exitCode = 1;
      
      for (var n = 0; n < lintErrors.length; n += 1) {
        var colorizedOutput = true;
        console.log(clc.green("Linter found errors ----------------"));
        console.log(linted.explainError(postFixLintErrors[n], colorizedOutput) + '\n');
      }
    } else {
      console.log(clc.greenBright('No lintable errors!  ' + clc.yellowBright('d=(´▽ `)=b\n')));
    }
  }

console.log('Process exited with code ' +(exitCode ? '1 ' + clc.cyan('(ノಠ益ಠ)ノ') : '0 ' +  clc.yellowBright('(/^ O ^)/')));
process.exit(exitCode);


/*****************************************************
                      HELPERS
*****************************************************/

function autoFix(filePath, file){
  fs.writeFileSync(filePath, file);
  console.log(clc.magenta(clc.white('Auto fixing ') + filePath + '\n\n'));
}









