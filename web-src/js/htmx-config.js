// HTMX Configuration
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for HTMX');
    if (!window.htmx) {
        console.warn('HTMX is not loaded');
        return;
    }

    console.log('HTMX is loaded, configuring...');

    // Disable all default HTMX indicators
    Object.assign(window.htmx.config, {
        defaultIndicator: null,
        indicators: false
    });

    console.log('HTMX configuration complete');

    // Use custom spinner only
    window.htmx.defineExtension('disable-indicator', {
        onEvent: (name, evt) => {
            console.log('HTMX event:', name, evt);
            if (name === 'htmx:beforeRequest') {
                evt.detail.indicator = null;
                console.log('Request starting:', evt.detail.requestConfig);
            }
            if (name === 'htmx:afterRequest') {
                console.log('Request complete:', evt.detail.successful ? 'success' : 'failed');
            }
        }
    });

    // Add global event listeners for debugging
    document.body.addEventListener('htmx:configRequest', (evt) => {
        console.log('Configuring request:', evt.detail);
    });

    document.body.addEventListener('htmx:beforeRequest', (evt) => {
        console.log('Before request:', evt.detail.requestConfig);
    });

    document.body.addEventListener('htmx:afterRequest', (evt) => {
        console.log('After request:', evt.detail.successful ? 'success' : 'failed');
    });

    document.body.addEventListener('htmx:responseError', (evt) => {
        console.error('Response error:', evt.detail);
    });

    // Verify tbody element is properly configured
    const tbody = document.querySelector('tbody[hx-get]');
    if (tbody) {
        console.log('Found tbody with hx-get:', tbody.getAttribute('hx-get'));
        console.log('HTMX attributes:', {
            get: tbody.getAttribute('hx-get'),
            trigger: tbody.getAttribute('hx-trigger'),
            indicator: tbody.getAttribute('hx-indicator')
        });
    } else {
        console.warn('Could not find tbody with hx-get attribute');
    }
}); 