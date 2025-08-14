const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const { Buffer } = require('buffer');

function activate(context) {
    // Регистрируем провайдер для DBML
    const provider = new DbmlPreviewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'dbmlPreview',
            provider
        )
    );

    // Регистрируем команду для ручного просмотра
    context.subscriptions.push(
        vscode.commands.registerCommand('dbml.showPreview', () => {
            DbmlPanel.createOrShow(context);
        })
    );

    // Для рендеринга в markdown
    return {
        extendMarkdownIt(md) {
            const renderDbml = async (dbmlCode) => {
                try {
                    const tempDir = path.join(context.extensionPath, 'temp');
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir);
                    }

                    const tempDbml = path.join(tempDir, `temp-${Date.now()}.dbml`);
                    const tempSvg = path.join(tempDir, `temp-${Date.now()}.svg`);

                    fs.writeFileSync(tempDbml, dbmlCode);

                    const rendererPath = path.join(
                        context.extensionPath,
                        '@softwaretechnik',
                        'dbml-renderer',
                        'lib',
                        'index.js'
                    );

                    child_process.execSync(`node "${rendererPath}" -i "${tempDbml}" -o "${tempSvg}"`);

                    const svgContent = fs.readFileSync(tempSvg, 'utf8');
                    
                    // Конвертируем в base64
                    const svgBase64 = Buffer.from(svgContent).toString('base64');
                    
                    fs.unlinkSync(tempDbml);
                    fs.unlinkSync(tempSvg);

                    return `<img src="data:image/svg+xml;base64,${svgBase64}" style="max-width:100%;"/>`;
                } catch (error) {
                    console.error('DBML render error:', error);
                    return `<div style="color:red;">DBML render error: ${error.message}</div>`;
                }
            };

            md.core.ruler.after('block', 'dbml-renderer', async (state) => {
                const tokens = state.tokens;
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token.type === 'fence' && token.info.trim() === 'dbml') {
                        const dbmlCode = token.content;
                        const rendered = await renderDbml(dbmlCode);
                        
                        const newToken = new state.Token('html_block', '', 0);
                        newToken.content = rendered;
                        tokens.splice(i, 1, newToken);
                    }
                }
            });

            return md;
        }
    };
}

class DbmlPreviewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }

    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview('');
    }

    _getHtmlForWebview(svgContent) {
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DBML Preview</title>
            <style>
                body { margin: 0; padding: 10px; }
                svg { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            ${svgContent}
        </body>
        </html>`;
    }
}

class DbmlPanel {
    static createOrShow(context) {
        if (DbmlPanel.currentPanel) {
            DbmlPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'dbmlPreview',
            'DBML Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );

        DbmlPanel.currentPanel = new DbmlPanel(panel, context);
    }

    constructor(panel, context) {
        this._panel = panel;
        this._context = context;
        this._update();
    }

    async _update() {
        const svg = await this._renderDbml();
        this._panel.webview.html = this._getHtml(svg);
    }

    async _renderDbml() {
        const tempDir = path.join(this._context.extensionPath, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempDbml = path.join(tempDir, `temp-${Date.now()}.dbml`);
        const tempSvg = path.join(tempDir, `temp-${Date.now()}.svg`);

        // Пример DBML кода - в реальном приложении нужно получать из редактора
        const dbmlCode = `Table users {
            id integer [primary key]
            name varchar
        }`;

        fs.writeFileSync(tempDbml, dbmlCode);
        
        const rendererPath = path.join(
            this._context.extensionPath,
            '@softwaretechnik',
            'dbml-renderer',
            'lib',
            'index.js'
        );
        
        child_process.execSync(`node "${rendererPath}" -i "${tempDbml}" -o "${tempSvg}"`);
        
        const svgContent = fs.readFileSync(tempSvg, 'utf8');
        
        fs.unlinkSync(tempDbml);
        fs.unlinkSync(tempSvg);

        return svgContent;
    }

    _getHtml(svgContent) {
        // Очистка SVG от потенциально опасных элементов
        const cleanSvg = svgContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/g, '');

        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                img-src data:;
                style-src 'unsafe-inline'">
        </head>
        <body>${cleanSvg}</body>
        </html>`;
    }
}

DbmlPanel.currentPanel = undefined;

function deactivate() {}

module.exports = {
    activate,
    deactivate
};