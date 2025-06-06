# Product Export Feature

This directory contains documentation specific to the product export functionality.

## Overview

The product export feature allows users to:

1. Query products from Adobe Commerce
2. Transform the data into a standardized format
3. Generate and download CSV files
4. Cache results for improved performance

## Documentation Index

- [Architecture](architecture.md) - System design and components
- [Configuration](configuration.md) - Available configuration options
- [Performance](performance.md) - Performance considerations and optimization
- [Caching](caching.md) - Caching strategy and implementation
- [Testing](testing.md) - Testing procedures and guidelines

## Feature Status

Current version: 1.0.0
Status: Production Ready

## Known Limitations

- Maximum of 100,000 products per export
- CSV file size limit of 1GB
- Cache retention period of 24 hours
