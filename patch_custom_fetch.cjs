const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const originalFetch = window\.fetch;\nwindow\.fetch = async \(input, init\) => \{/g, 'const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {\n  const originalFetch = window.fetch;');

code = code.replace(/fetch\(/g, 'customFetch(');
code = code.replace(/originalcustomFetch\(/g, 'originalFetch(');
code = code.replace(/const customFetch = async \(input: RequestInfo \| URL, init\?: RequestInit\) => \{\n  const originalFetch = window\.customFetch;/g, 'const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {\n  const originalFetch = window.fetch;');

fs.writeFileSync('src/App.tsx', code);
