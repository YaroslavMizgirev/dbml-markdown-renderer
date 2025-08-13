// Этот код остается таким же, как в предыдущем примере
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = function markdownitDbml(md) {
  function renderDbml(code) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const inputPath = path.join(tempDir, `temp_${Date.now()}.dbml`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.svg`);

    try {
      fs.writeFileSync(inputPath, code, 'utf-8');
      execSync(`./node_modules/.bin/dbml-renderer -i "${inputPath}" -o "${outputPath}"`, { encoding: 'utf-8' });
      const svgContent = fs.readFileSync(outputPath, 'utf-8');
      return `<div class="dbml-rendered">${svgContent}</div>`;
    } catch (error) {
      return `<pre class="dbml-error">Error rendering DBML: ${error.message}</pre>`;
    } finally {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  }

  const defaultRender = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info === 'dbml') {
      return renderDbml(token.content);
    }
    return defaultRender(tokens, idx, options, env, self);
  };
};