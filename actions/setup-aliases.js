const moduleAlias = require('module-alias');
const path = require('path');

// Add aliases for backend code
moduleAlias.addAliases({
  '@shared': path.resolve(__dirname, 'shared'),
  '@backend-actions': path.resolve(__dirname, '.'),
  '@frontend-actions': path.resolve(__dirname, 'frontend')
}); 