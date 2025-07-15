/**
 * Core Action - Domain Loading Operations
 * Business logic for loading domain catalogs
 */

/**
 * Load domain catalogs for action initialization
 * @param {Array<string>} domains - Domain names to load
 * @returns {Promise<Object>} Domain catalogs object
 */
async function loadDomainCatalogs(domains = []) {
  const domainCatalogs = {};

  for (const domain of domains) {
    try {
      domainCatalogs[domain] = require(`../../${domain}`);
    } catch (error) {
      throw new Error(`Failed to load domain catalog: ${domain} (${error.message})`);
    }
  }

  return domainCatalogs;
}

module.exports = {
  loadDomainCatalogs,
};
