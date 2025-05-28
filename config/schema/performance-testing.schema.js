/**
 * Performance testing configuration schema
 * @module config/schema/performance-testing
 */

const performanceSchema = {
    type: 'object',
    required: ['scenarios', 'thresholds', 'baseline'],
    properties: {
        scenarios: {
            type: 'object',
            required: ['small', 'medium', 'large'],
            properties: {
                small: {
                    type: 'object',
                    required: ['name', 'params'],
                    properties: {
                        name: {
                            type: 'string',
                            default: 'Small Dataset'
                        },
                        params: {
                            type: 'object',
                            required: ['limit'],
                            properties: {
                                limit: {
                                    type: 'number',
                                    default: 50
                                },
                                include_inventory: {
                                    type: 'boolean',
                                    default: true
                                },
                                include_categories: {
                                    type: 'boolean',
                                    default: true
                                }
                            }
                        }
                    }
                },
                medium: {
                    type: 'object',
                    required: ['name', 'params'],
                    properties: {
                        name: {
                            type: 'string',
                            default: 'Medium Dataset'
                        },
                        params: {
                            type: 'object',
                            required: ['limit'],
                            properties: {
                                limit: {
                                    type: 'number',
                                    default: 100
                                },
                                include_inventory: {
                                    type: 'boolean',
                                    default: true
                                },
                                include_categories: {
                                    type: 'boolean',
                                    default: true
                                }
                            }
                        }
                    }
                },
                large: {
                    type: 'object',
                    required: ['name', 'params'],
                    properties: {
                        name: {
                            type: 'string',
                            default: 'Large Dataset'
                        },
                        params: {
                            type: 'object',
                            required: ['limit'],
                            properties: {
                                limit: {
                                    type: 'number',
                                    default: 200
                                },
                                include_inventory: {
                                    type: 'boolean',
                                    default: true
                                },
                                include_categories: {
                                    type: 'boolean',
                                    default: true
                                }
                            }
                        }
                    }
                }
            }
        },
        thresholds: {
            type: 'object',
            required: ['executionTime', 'memory', 'products', 'categories', 'compression'],
            properties: {
                executionTime: {
                    type: 'number',
                    description: 'Allowed variance in execution time (0-1)',
                    minimum: 0,
                    maximum: 1,
                    default: 0.15
                },
                memory: {
                    type: 'number',
                    description: 'Allowed variance in memory usage (0-1)',
                    minimum: 0,
                    maximum: 1,
                    default: 0.10
                },
                products: {
                    type: 'number',
                    description: 'Allowed variance in product count',
                    minimum: 0,
                    default: 0
                },
                categories: {
                    type: 'number',
                    description: 'Allowed variance in category count',
                    minimum: 0,
                    default: 0
                },
                compression: {
                    type: 'number',
                    description: 'Allowed variance in compression ratio (0-1)',
                    minimum: 0,
                    maximum: 1,
                    default: 0.05
                }
            }
        },
        baseline: {
            type: 'object',
            required: ['maxAgeDays'],
            properties: {
                maxAgeDays: {
                    type: 'number',
                    description: 'Maximum age of baseline metrics in days',
                    minimum: 1,
                    default: 7
                }
            }
        }
    }
};

module.exports = performanceSchema; 