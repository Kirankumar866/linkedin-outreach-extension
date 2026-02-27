// Background Service Worker — OAuth & Gmail Proxy

// Handle OAuth token requests from popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAuthToken') {
        chrome.identity.getAuthToken({ interactive: request.interactive || false }, (token) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, token: token });
            }
        });
        return true; // Async response
    }

    if (request.action === 'revokeAuthToken') {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (token) {
                chrome.identity.removeCachedAuthToken({ token: token }, () => {
                    // Also revoke on Google's side
                    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                        .then(() => sendResponse({ success: true }))
                        .catch(() => sendResponse({ success: true })); // Still remove locally
                });
            } else {
                sendResponse({ success: true });
            }
        });
        return true;
    }

    if (request.action === 'sendGmail') {
        const { to, subject, body } = request;
        chrome.identity.getAuthToken({ interactive: false }, async (token) => {
            if (chrome.runtime.lastError || !token) {
                sendResponse({ success: false, error: 'Not authenticated with Gmail' });
                return;
            }

            const email = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8',
                'MIME-Version: 1.0',
                '',
                body
            ].join('\r\n');

            const raw = btoa(unescape(encodeURIComponent(email)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            try {
                const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ raw })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    sendResponse({ success: false, error: errData.error?.message || 'Send failed' });
                } else {
                    const data = await response.json();
                    sendResponse({ success: true, messageId: data.id });
                }
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        });
        return true;
    }
});

// Show badge when on LinkedIn
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com')) {
        chrome.action.setBadgeText({ text: 'LI', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#6c63ff', tabId });
    }
});
