#! /usr/bin/env node

var fs = require('fs');
var fixMyJs = require('fixmyjs');
var jshint = require('jshint').JSHINT;
var JSCS = require('jscs');
var clc = require('cli-color');
var program = require('commander');
var checker = new JSCS();

program
  .version('0.0.9')
  .option('-f, --fix', 'autofix javascript during linting')
  .option('-w, --whitespace', 'only lint for whitespace')
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

// initializations
var exitCode = 0;

// set the correct config based on the presence/lack of -w flag
if (program.whiteSpace) {
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
for (var i = 0; i < program.args.length; i += 1) {

  var rawCode = fs.readFileSync(program.args[i]).toString();
  var linted = checker.checkString(rawCode);
  var lintErrors = linted.getErrorList();

  // reporter header for each file
  console.log(clc.yellow(clc.white('\nLinting ') + program.args[i]));
  console.log(clc.blue('***************************************************************'));

  // if "-f" was present in arguments, run the lint and fix operation
  if (program.fix) {
    var linterFixed = undefined;

    if (program.whitespace) {
      linterFixed = checker.fixString(rawCode, program.args[i]);
    } else {
      var fmjsFixed = fixMyJs.fix(rawCode, fmjsOptions);
      linterFixed = checker.fixString(fmjsFixed, program.args[i]);
    }

    // run auto fix if we have lint errors
    if (lintErrors.length > 0) {

      if (linterFixed && linterFixed.output.length > 0) {
        autoFix(program.args[i], linterFixed.output);
      }

      var postFixLinted = checker.checkString(linterFixed.output);
      var postFixLintErrors = postFixLinted.getErrorList();

      // re-lint after auto fixing and see if we have remaining errors
      if (postFixLintErrors.length > 0) {
        exitCode = 1;

        for (var n = 0; n < postFixLintErrors.length; n += 1) {
          var colorizedOutput = true;
          console.log(clc.green('Remaining errors after autofix----------------'));
          console.log(linted.explainError(postFixLintErrors[n], colorizedOutput) + '\n');
        }
      }
    } else {
      console.log(clc.greenBright('No lintable errors!  ' + clc.yellowBright('d=(´▽ `)=b\n')));
    }

  // if no autofix flag is present, just run the linter and report the errors
  } else {
    if (lintErrors.length > 0) {
      exitCode = 1;

      for (var j = 0; j < lintErrors.length; j += 1) {
        var colorizedOutput = true;
        console.log(clc.green('Linter found errors ----------------'));
        console.log(linted.explainError(lintErrors[j], colorizedOutput) + '\n');
      }
    } else {
      console.log(clc.greenBright('No lintable errors!  ' + clc.yellowBright('d=(´▽ `)=b\n')));
    }
  }
}

console.log('Process exited with code ' + (exitCode ? '1 ' + clc.cyan('(ノಠ益ಠ)ノ') : '0 ' +  clc.yellowBright('(/^ O ^)/')));
process.exit(exitCode);

/*****************************************************
                      HELPERS
*****************************************************/

function autoFix(filePath, file) {
  fs.writeFileSync(filePath, file);
  console.log(clc.magenta(clc.white('Auto fixing ') + filePath + '\n\n'));
}
