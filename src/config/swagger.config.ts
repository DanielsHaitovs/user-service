/**
 * Swagger dark theme CSS styles
 */
const SWAGGER_DARK_THEME_CSS = `
/* Dark Theme for Swagger UI */
html, body {
  background-color: #0d1117 !important;
}

.swagger-ui * {
  color: #f0f6fc !important;
}

.swagger-ui {
  background-color: #0d1117 !important;
  color: #f0f6fc !important;
}

.swagger-ui .topbar {
  background-color: #161b22 !important;
  border-bottom: 1px solid #21262d !important;
}

.swagger-ui .topbar .download-url-wrapper {
  background-color: #0d1117 !important;
}

.swagger-ui .topbar .download-url-wrapper input[type=text] {
  background-color: #21262d !important;
  border: 1px solid #30363d !important;
  color: #f0f6fc !important;
}

.swagger-ui .info {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  margin: 20px 0 !important;
  padding: 20px !important;
  border-radius: 6px !important;
}

.swagger-ui .info hgroup.main .title {
  color: #f0f6fc !important;
}

.swagger-ui .info p, .swagger-ui .info li {
  color: #8b949e !important;
}

.swagger-ui .scheme-container {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  padding: 20px !important;
  margin: 20px 0 !important;
}

.swagger-ui .opblock-tag {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  margin-bottom: 20px !important;
}

.swagger-ui .opblock-tag:hover {
  background-color: #21262d !important;
}

.swagger-ui .opblock {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  margin-bottom: 15px !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
}

.swagger-ui .opblock .opblock-summary {
  background-color: transparent !important;
  border-bottom: 1px solid #21262d !important;
  padding: 15px !important;
}

.swagger-ui .opblock .opblock-summary:hover {
  background-color: #21262d !important;
}

.swagger-ui .opblock.opblock-post .opblock-summary {
  border-left: 4px solid #238636 !important;
}

.swagger-ui .opblock.opblock-get .opblock-summary {
  border-left: 4px solid #1f6feb !important;
}

.swagger-ui .opblock.opblock-put .opblock-summary {
  border-left: 4px solid #fb8500 !important;
}

.swagger-ui .opblock.opblock-delete .opblock-summary {
  border-left: 4px solid #da3633 !important;
}

.swagger-ui .opblock.opblock-patch .opblock-summary {
  border-left: 4px solid #8b5cf6 !important;
}

.swagger-ui .opblock .opblock-summary-method {
  background-color: #0d1117 !important;
  color: #ffffff !important;
  border: 1px solid #30363d !important;
  border-radius: 4px !important;
  font-weight: bold !important;
  min-width: 70px !important;
  text-align: center !important;
}

.swagger-ui .opblock-section-header {
  background-color: #21262d !important;
  color: #f0f6fc !important;
  border-bottom: 1px solid #30363d !important;
  padding: 15px !important;
}

.swagger-ui .parameters-col_description p {
  color: #8b949e !important;
}

.swagger-ui .parameter__name {
  color: #f0f6fc !important;
}

.swagger-ui .parameter__type {
  color: #58a6ff !important;
}

.swagger-ui table {
  background-color: #161b22 !important;
}

.swagger-ui table thead tr th {
  background-color: #21262d !important;
  color: #f0f6fc !important;
  border-bottom: 1px solid #30363d !important;
}

.swagger-ui table tbody tr td {
  background-color: #161b22 !important;
  color: #8b949e !important;
  border-bottom: 1px solid #30363d !important;
}

.swagger-ui table tbody tr:hover td {
  background-color: #21262d !important;
}

.swagger-ui input[type=text],
.swagger-ui input[type=password],
.swagger-ui input[type=search],
.swagger-ui input[type=email],
.swagger-ui input[type=file],
.swagger-ui textarea,
.swagger-ui select {
  background-color: #21262d !important;
  border: 1px solid #30363d !important;
  color: #f0f6fc !important;
  border-radius: 4px !important;
  padding: 8px 12px !important;
}

.swagger-ui input:focus,
.swagger-ui textarea:focus,
.swagger-ui select:focus {
  background-color: #0d1117 !important;
  border-color: #1f6feb !important;
  box-shadow: 0 0 0 2px rgba(31, 111, 235, 0.2) !important;
}

.swagger-ui .btn {
  background-color: #21262d !important;
  border: 1px solid #30363d !important;
  color: #f0f6fc !important;
  border-radius: 6px !important;
  padding: 8px 16px !important;
  font-weight: 500 !important;
}

.swagger-ui .btn:hover {
  background-color: #30363d !important;
}

.swagger-ui .btn.execute {
  background-color: #238636 !important;
  border-color: #238636 !important;
  color: #ffffff !important;
}

.swagger-ui .btn.execute:hover {
  background-color: #2ea043 !important;
}

.swagger-ui .btn.cancel {
  background-color: #da3633 !important;
  border-color: #da3633 !important;
  color: #ffffff !important;
}

.swagger-ui .btn.cancel:hover {
  background-color: #f85149 !important;
}

.swagger-ui .highlight-code {
  background-color: #0d1117 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
}

.swagger-ui .highlight-code pre {
  background-color: transparent !important;
  color: #f0f6fc !important;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
}

.swagger-ui .responses-inner {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  padding: 15px !important;
}

.swagger-ui .response-col_status {
  color: #f0f6fc !important;
}

.swagger-ui .response-col_description {
  color: #8b949e !important;
}

.swagger-ui .model-box {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  padding: 15px !important;
}

.swagger-ui .model .property {
  color: #f0f6fc !important;
}

.swagger-ui .model .property-type {
  color: #58a6ff !important;
}

.swagger-ui .model-title {
  color: #f0f6fc !important;
}

.swagger-ui .auth-container {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  padding: 20px !important;
}

.swagger-ui .auth-container h4 {
  color: #f0f6fc !important;
}

.swagger-ui .dialog-ux .modal-ux {
  background-color: #161b22 !important;
  border: 1px solid #21262d !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
}

.swagger-ui .dialog-ux .modal-ux-header {
  background-color: #21262d !important;
  border-bottom: 1px solid #30363d !important;
  color: #f0f6fc !important;
}

.swagger-ui .dialog-ux .modal-ux-content {
  background-color: #161b22 !important;
  color: #8b949e !important;
}

.swagger-ui .errors-wrapper {
  background-color: #da3633 !important;
  color: #ffffff !important;
  border-radius: 6px !important;
  padding: 15px !important;
  margin: 10px 0 !important;
}

.swagger-ui .copy-to-clipboard {
  background-color: #21262d !important;
  border: 1px solid #30363d !important;
  color: #f0f6fc !important;
}

.swagger-ui .copy-to-clipboard:hover {
  background-color: #30363d !important;
}

.swagger-ui ::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}

.swagger-ui ::-webkit-scrollbar-track {
  background: #0d1117 !important;
}

.swagger-ui ::-webkit-scrollbar-thumb {
  background: #30363d !important;
  border-radius: 4px !important;
}

.swagger-ui ::-webkit-scrollbar-thumb:hover {
  background: #484f58 !important;
}

.swagger-ui a {
  color: #58a6ff !important;
  text-decoration: none !important;
}

.swagger-ui a:hover {
  color: #79c0ff !important;
  text-decoration: underline !important;
}

.swagger-ui .loading-container {
  background-color: #0d1117 !important;
}

.swagger-ui .wrapper,
.swagger-ui .information-container,
.swagger-ui .scheme-container .schemes > label,
.swagger-ui section.models,
.swagger-ui section.models .model-container,
.swagger-ui .opblock-body,
.swagger-ui .opblock-description-wrapper,
.swagger-ui .opblock-external-docs-wrapper,
.swagger-ui .opblock-title_normal,
.swagger-ui .parameters-container,
.swagger-ui .responses-wrapper {
  background-color: #0d1117 !important;
}

.swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5, .swagger-ui h6 {
  color: #f0f6fc !important;
}

.swagger-ui p, .swagger-ui span, .swagger-ui div, .swagger-ui label {
  color: #8b949e !important;
}

.swagger-ui .opblock-summary-description,
.swagger-ui .opblock-summary-path {
  color: #f0f6fc !important;
}
`;

/**
 * Swagger configuration options with dark theme
 */
export const swaggerSetupOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
  },
  customSiteTitle: 'MakeEasyCommerce API Docs',
  customfavIcon: '/favicon.ico',
  customCss: SWAGGER_DARK_THEME_CSS,
};
