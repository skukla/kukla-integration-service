/**
 * Files Domain Catalog
 *
 * Hierarchical organization of files domain functionality.
 * Provides discoverability at multiple abstraction levels.
 */

// High-level workflows (what users actually want to do)
// Mid-level operations (how the domain works)
const { initializeAppBuilderStorage } = require('./operations/app-builder');
const {
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  getFileProperties,
  getFileMetadata,
} = require('./operations/file-operations');
const { initializeS3Storage } = require('./operations/s3-storage');
// Low-level utilities (implementation details)
const { CacheConfig, MemoryCache, HttpCache, FileCache } = require('./utils/cache');
const {
  getCsvConfig,
  generateCsv,
  createCsvStream,
  createCsvTransform,
  createWriter,
  createRowTransformer,
  createCsvStringifier,
} = require('./utils/csv');
const {
  createFileOperationError,
  isFileOperationError,
  mapErrorCodeToType,
  createUserFriendlyErrorMessage,
  createFileError,
  getContentType,
  validatePath,
  removePublicPrefix,
} = require('./utils/errors');
const {
  extractCleanFilename,
  addPublicPrefix,
  normalizePath,
  isPathSafe,
  joinPaths,
  getDirectory,
  getFilename,
  getExtension,
  changeExtension,
} = require('./utils/paths');
const {
  initializeStorage,
  storeCsvFile,
  readStoredFile,
  deleteStoredFile,
  listCsvFiles,
} = require('./workflows/file-management');

// Main exports - flat access for compatibility
module.exports = {
  // High-level workflows
  initializeStorage,
  storeCsv: storeCsvFile,
  storeCsvFile,
  readStoredFile,
  deleteStoredFile,
  listCsvFiles,

  // Core operations
  initializeAppBuilderStorage,
  initializeS3Storage,
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  getFileProperties,
  getFileMetadata,

  // Error handling
  createFileOperationError,
  isFileOperationError,
  mapErrorCodeToType,
  createUserFriendlyErrorMessage,
  createFileError,

  // Path utilities
  extractCleanFilename,
  addPublicPrefix,
  normalizePath,
  isPathSafe,
  joinPaths,
  getDirectory,
  getFilename,
  getExtension,
  changeExtension,
  removePublicPrefix,

  // CSV operations
  getCsvConfig,
  generateCsv,
  createCsvStream,
  createCsvTransform,
  createWriter,
  createRowTransformer,
  createCsvStringifier,

  // Cache utilities
  CacheConfig,
  MemoryCache,
  HttpCache,
  FileCache,

  // Utilities
  getContentType,
  validatePath,

  // Convenience functions
  filterCsvFiles: (files) => files.filter((file) => file.name.endsWith('.csv')),
  getStorageInfo: (storage) => ({
    provider: storage.provider,
    bucket: storage.bucket, // For S3
    namespace: storage.namespace, // For App Builder (if applicable)
  }),

  // Structured access for organized usage
  workflows: {
    fileManagement: require('./workflows/file-management'),
  },

  operations: {
    appBuilder: require('./operations/app-builder'),
    s3Storage: require('./operations/s3-storage'),
    fileOperations: require('./operations/file-operations'),
  },

  utils: {
    paths: require('./utils/paths'),
    csv: require('./utils/csv'),
    cache: require('./utils/cache'),
    validation: require('./utils/validation'),
    storageFactories: require('./utils/storage-factories'),
    errors: require('./utils/errors'),
  },
};
