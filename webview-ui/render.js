// Этот код будет выполняться внутри Webview
const vscode = acquireVsCodeApi();
const container = document.getElementById('diagram-container');

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'update') {
        renderDbml(message.text);
    }
});

function renderDbml(code) {
    // В зависимости от того, какую библиотеку вы выберете, здесь будет логика рендеринга.
    // Например, с @dbml/core и какой-то диаграммной библиотекой.
    // Примерная логика (вам нужно будет найти подходящую библиотеку для визуализации):
    // try {
    //     const parser = new dbml.Parser();
    //     const database = parser.parse(code, 'dbml');
    //     const svg = someDiagramLibrary.render(database);
    //     container.innerHTML = svg;
    // } catch (error) {
    //     container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    // }
    
    // В качестве временной заглушки просто покажем текст
    container.innerHTML = `<pre>${code}</pre>`;
}