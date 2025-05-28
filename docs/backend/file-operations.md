# File Operations Module

The File Operations module (`actions/core/files.js`) provides a standardized way to handle file operations across the application. It includes robust error handling, path validation, and consistent metadata formatting.

## Features

- Standardized file operations (read, write, delete, list)
- Consistent error handling with `FileOperationError` class
- Path validation and security checks
- File metadata formatting utilities
- Type definitions and JSDoc documentation

## API Reference

### Core Operations

1. `readFile(files, path)`
   - Reads file content as a buffer
   - Validates path security
   - Handles common errors

2. `writeFile(files, path, content)`
   - Writes content to file
   - Creates directories if needed
   - Validates path security

3. `deleteFile(files, path)`
   - Deletes a file
   - Validates path security
   - Handles not found cases

4. `listFiles(files, directory)`
   - Lists files in directory
   - Includes metadata
   - Formats file information

5. `getFileProperties(files, path)`
   - Gets file metadata
   - Formats size and dates
   - Includes content type

### Utility Functions

1. `removePublicPrefix(filePath)`
   - Removes 'public/' prefix from paths
   - Used for display purposes

2. `formatFileSize(bytes)`
   - Formats size in human-readable form
   - Handles various size ranges

3. `formatFileDate(date)`
   - Formats dates consistently
   - Uses locale settings

### Error Handling

The module uses a custom `FileOperationError` class with predefined error types:

```javascript
const FileErrorType = {
    NOT_FOUND: 'FILE_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INVALID_PATH: 'INVALID_PATH',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    UNKNOWN: 'UNKNOWN_ERROR'
};
```

### Usage Example

```javascript
const {
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    getFileProperties,
    FileOperationError,
    FileErrorType
} = require('../../core/files');

async function handleFile(files, path) {
    try {
        const content = await readFile(files, path);
        // Process content...
    } catch (error) {
        if (error instanceof FileOperationError) {
            switch (error.type) {
                case FileErrorType.NOT_FOUND:
                    // Handle not found...
                    break;
                case FileErrorType.PERMISSION_DENIED:
                    // Handle permission denied...
                    break;
                default:
                    // Handle other errors...
            }
        }
    }
}
```

## Security Considerations

The module implements several security measures:

1. Path validation to prevent directory traversal
2. Permission checks on operations
3. Secure error handling that doesn't leak internals
4. Content type validation where applicable

## Integration Examples

Here's how to use the module in various contexts:

```javascript
const {
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    getFileProperties,
    FileOperationError,
    FileErrorType
} = require('../../core/files');

async function processFile(files, path) {
    try {
        // Read file
        const content = await readFile(files, path);
        
        // Process content
        const modified = processContent(content);
        
        // Write back
        await writeFile(files, path, modified);
        
        // Get updated properties
        const props = await getFileProperties(files, path);
        
        return {
            success: true,
            size: props.size,
            lastModified: props.lastModified
        };
    } catch (error) {
        handleFileError(error);
    }
}
```

## Best Practices

1. Always use try/catch with file operations
2. Check for specific error types
3. Validate paths before operations
4. Use the provided formatting utilities
5. Handle errors appropriately for your context
