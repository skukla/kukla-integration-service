/**
 * GENERATED FILE - DO NOT EDIT
 * Frontend URL module generated from backend configuration
 */

export function getActionUrl(action) {
  return '/api/' + action;
}

export function getDownloadUrl(fileName, path = '') {
  return '/api/download?file=' + encodeURIComponent(path + fileName);
}

export function buildDownloadUrl(filePath) {
  return '/api/download?file=' + encodeURIComponent(filePath);
}
