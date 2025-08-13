const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "dbml-markdown-renderer" is now active!');
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};