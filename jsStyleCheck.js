#! /usr/bin/env node

var fs = require('fs');
var fixMyJs = require('fixmyjs');
var jshint = require('jshint').JSHINT;
var JSCS = require('jscs');
var glob = require('glob');
var clc = require('cli-color');
var checker = new JSCS();

var exitCode = 0;
var filePaths = process.argv.slice(2, process.argv.length - 2);
var configFlag = process.argv[process.argv.length - 1];
var config = undefined;

if (configFlag === "-w") {
  config = 'volt-whitespace';
} else {
  config = 'volt-full-lint'
}

checker.registerDefaultRules();
checker.configure({
  preset: config
});

var fmjsOptions = {
  camelcase: true,
  plusplus: true,
  curly: true,
  eqeqeq: true,
};


for (var i = 0; i < filePaths.length; i += 1) {

  var rawCode = fs.readFileSync(filePaths[i]).toString();
  var linted = checker.checkString(rawCode);
  var lintErrors = linted.getErrorList();
  var linterFixed = undefined;

  if (configFlag === "-w") {
    linterFixed = checker.fixString(rawCode, filePaths[i]);
  } else {
    var fmjsFixed = fixMyJs.fix(rawCode, fmjsOptions);
    linterFixed = checker.fixString(fmjsFixed, filePaths[i]);
  }

  console.log(clc.yellow(clc.white('\nLinting ') + filePaths[i]));
  console.log(clc.blue('***************************************************************'));

  if (lintErrors.length > 0) {
    
    if (linterFixed && linterFixed.output.length > 0) {
      fs.writeFileSync(filePaths[i], linterFixed.output);
      console.log(clc.magenta(clc.white('Auto fixing ') + filePaths[i] + '\n\n'));
    }

    var postFixLinted = checker.checkString(linterFixed.output);
    var postFixLintErrors = postFixLinted.getErrorList();

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
}

console.log('Process exited with code ' +(exitCode ? '1 ' + clc.cyan('(ノಠ益ಠ)ノ') : '0 ' +  clc.yellowBright('(/^ ▽ ^)/')));
process.exit(exitCode);

