#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Read app.config.yaml
const appConfig = yaml.load(fs.readFileSync('app.config.yaml', 'utf8'));

// Extract action information from the runtime manifest
const actionsConfig = appConfig.application.runtimeManifest.packages['kukla-integration-service'].actions;
const actions = Object.keys(actionsConfig);

// Extract metadata for each action
const actionMetadata = actions.reduce((acc, action) => {
    const config = actionsConfig[action];
    acc[action] = {
        function: config.function,
        runtime: config.runtime,
        web: config.web === 'yes',
        requiresAuth: config.annotations?.['require-adobe-auth'] !== false
    };
    return acc;
}, {});

// Generate the actions file content
const content = `/**
 * GENERATED FILE - DO NOT MODIFY DIRECTLY
 * Generated from app.config.yaml by scripts/generate-actions.js
 * @generated
 */

/**
 * Known action endpoints in the application with their metadata
 * @constant {Object}
 */
export const ACTION_METADATA = ${JSON.stringify(actionMetadata, null, 2)};

/**
 * List of all known action names
 * @constant {string[]}
 */
export const KNOWN_ACTIONS = ${JSON.stringify(actions, null, 2)};

/**
 * Generates a URL for an App Builder action with optional parameters
 * @param {string} action - The action name (e.g., '${actions[0]}')
 * @param {Object} [params={}] - URL parameters to append to the action URL
 * @param {Object} [options={}] - Additional options for URL generation
 * @param {boolean} [options.validateAction=true] - Whether to validate the action name against known actions
 * @param {boolean} [options.addLeadingSlash=true] - Whether to add a leading slash to the URL
 * @returns {string} The formatted URL with encoded query parameters
 * @throws {Error} If action validation is enabled and the action is not in KNOWN_ACTIONS
 * @example
 * // Basic usage
 * getActionUrl('browse-files') // Returns: '/api/v1/web/kukla-integration-service/browse-files'
 * 
 * // With parameters
 * getActionUrl('download-file', { fileId: '123' }) // Returns: '/api/v1/web/kukla-integration-service/download-file?fileId=123'
 */
export function getActionUrl(action, params = {}, options = {}) {
    const { validateAction = true, addLeadingSlash = true } = options;
    
    if (validateAction && !KNOWN_ACTIONS.includes(action)) {
        throw new Error(\`Unknown action: \${action}. Valid actions are: \${KNOWN_ACTIONS.join(', ')}\`);
    }

    // Build base URL
    const baseUrl = addLeadingSlash ? \`/api/v1/web/kukla-integration-service/\${action}\` : action;
    
    // Filter out undefined/null parameters and encode the rest
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
        }
    }

    const queryString = queryParams.toString();
    return queryString ? \`\${baseUrl}?\${queryString}\` : baseUrl;
}

/**
 * Encodes a URL with query parameters safely for use in URLs
 * @param {string} url - The URL to encode
 * @returns {string} The encoded URL
 * @example
 * encodeActionUrl('/path?param=value&special= ') // Returns encoded URL safe for use
 */
export function encodeActionUrl(url) {
    return encodeURIComponent(url);
}

/**
 * Checks if a given action name is valid
 * @param {string} action - The action name to validate
 * @returns {boolean} True if the action is valid
 * @example
 * isValidAction('browse-files') // Returns: true
 * isValidAction('unknown-action') // Returns: false
 */
export function isValidAction(action) {
    return KNOWN_ACTIONS.includes(action);
}

/**
 * Gets metadata for a specific action
 * @param {string} action - The action name to get metadata for
 * @returns {Object|undefined} The action metadata or undefined if action doesn't exist
 * @example
 * getActionMetadata('browse-files') // Returns: { function: '...', runtime: '...', web: true, ... }
 */
export function getActionMetadata(action) {
    return ACTION_METADATA[action];
}
`;

// Ensure the directory exists
const outputDir = path.join('web-src', 'src', 'js', 'utils');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write the generated file
const outputPath = path.join(outputDir, 'action-urls.js');
fs.writeFileSync(outputPath, content);

console.log(`Generated action utilities at ${outputPath}`); 