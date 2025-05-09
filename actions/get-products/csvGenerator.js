const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvHeaders = [
  'entity.name', 'entity.category', 'entity.message', 'entity.entity.value',
  'entity.pageUrl', 'entity.inventory', 'entity.margin', 'entity.type',
  'entity.custom1', 'entity.custom2', 'entity.custom3', 'entity.custom4',
  'entity.custom5', 'entity.custom6', 'entity.custom7', 'entity.custom8',
  'entity.custom9', 'entity.custom10'
];

function mapProductToCsvRow(product) {
  return {
    'entity.name': product.sku,
    'entity.category': Array.isArray(product.categories) ? product.categories.join(', ') : (product.categories || ''),
    'entity.message': product.name,
    'entity.entity.value': product.price,
    'entity.pageUrl': product.images && product.images.length > 0 ? product.images[0] : '',
    'entity.inventory': product.qty,
    'entity.margin': '', // Placeholder, can be filled if margin data is available
    'entity.type': 'mobile', // Example static value
    'entity.custom1': '',
    'entity.custom2': '',
    'entity.custom3': '',
    'entity.custom4': '',
    'entity.custom5': '',
    'entity.custom6': '',
    'entity.custom7': '',
    'entity.custom8': '',
    'entity.custom9': '',
    'entity.custom10': ''
  };
}

async function generateCsv(products, filePath) {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: csvHeaders.map(h => ({ id: h, title: h }))
  });
  const rows = products.map(mapProductToCsvRow);
  await csvWriter.writeRecords(rows);
  return filePath;
}

module.exports = { generateCsv }; 