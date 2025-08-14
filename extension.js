const vscode = require('vscode');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('DBML Markdown Renderer is now active!');

   return {
        extendMarkdownIt(md) {
            const tempDir = path.join(context.extensionPath, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Прямой путь к исполняемому файлу
            const dbmlRendererPath = path.join(context.extensionPath, '@softwaretechnik', 'dbml-renderer', 'lib', 'cli.js');

            md.core.ruler.after('block', 'dbml-renderer', (state) => {
                const tokens = state.tokens;
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type === 'fence' && token.info.trim() === 'dbml') {
                        const dbmlCode = token.content;

                        try {
                            const tempDbmlFile = path.join(tempDir, `temp-${Date.now()}.dbml`);
                            const tempSvgFile = path.join(tempDir, `temp-${Date.now()}.svg`);

                            fs.writeFileSync(tempDbmlFile, dbmlCode, 'utf8');

                            // Измененная команда для запуска
                            const command = `node "${dbmlRendererPath}" -i "${tempDbmlFile}" -o "${tempSvgFile}"`;
                            child_process.execSync(command);

                            const svgContent = fs.readFileSync(tempSvgFile, 'utf8');

                            // Заменяем оригинальный токен на HTML
                            const newToken = new state.Token('html_block', '', 0);
                            newToken.content = svgContent;
                            tokens.splice(i, 1, newToken);

                            // Очистка временных файлов
                            fs.unlinkSync(tempDbmlFile);
                            fs.unlinkSync(tempSvgFile);
                        } catch (e) {
                            console.error('Error rendering DBML:', e.message);
                            const errorToken = new state.Token('html_block', '', 0);
                            errorToken.content = `<pre style="color: red;">Error: Could not render DBML diagram. Check the code for syntax errors.</pre>`;
                            tokens.splice(i, 1, errorToken);
                        }
                    }
                }
            });

            return md;
        }
    };
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};