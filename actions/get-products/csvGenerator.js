const csvWriter = require('csv-writer');

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

async function generateCsv(products) {
  const csvStringifier = csvWriter.createObjectCsvStringifier({
    header: csvHeaders.map(h => ({ id: h, title: h }))
  });
  
  const rows = products.map(mapProductToCsvRow);
  const headerString = csvStringifier.getHeaderString();
  const rowString = csvStringifier.stringifyRecords(rows);
  
  return headerString + rowString;
}

module.exports = { generateCsv }; 