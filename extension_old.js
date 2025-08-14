const vscode = require('vscode');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('MYM: DBML Markdown Renderer is now active!');

   return {
        extendMarkdownIt(md) {
            const tempDir = path.join(context.extensionPath, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            console.log('MYM: tempDir Path:', tempDir);

            // Прямой путь к исполняемому файлу
            const dbmlRendererPath = path.join(context.extensionPath, '@softwaretechnik', 'dbml-renderer', 'lib', 'index.js');
            console.log('MYM: DBML Renderer Path:', dbmlRendererPath);

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
                            
                            const command = `node "${dbmlRendererPath}" -i "${tempDbmlFile}" -o "${tempSvgFile}"`;
                            child_process.execSync(command);

                            const svgContent = fs.readFileSync(tempSvgFile, 'utf8');
                            
                            // Новый способ вставки - безопасный Base64
                            const svgBase64 = Buffer.from(svgContent).toString('base64');
                            const imgTag = `<img src="data:image/svg+xml;base64,${svgBase64}" style="max-width:100%;"/>`;
                            
                            const container = new state.Token('html_block', '', 0);
                            container.content = `<div class="dbml-container">${imgTag}</div>`;
                            
                            tokens.splice(i, 1, container);

                            fs.unlinkSync(tempDbmlFile);
                            fs.unlinkSync(tempSvgFile);
                        } catch (e) {
                            console.error('DBML Render Error:', e);
                            const errorToken = new state.Token('html_block', '', 0);
                            errorToken.content = `<pre class="dbml-error">Error rendering DBML: ${e.message}</pre>`;
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