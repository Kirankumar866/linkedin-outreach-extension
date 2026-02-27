// Gmail Send Helper
// Uses dummy mode for now; swap with real OAuth when ready

const Gmail = {
    /**
     * Send an email via Gmail API
     * @param {Object} params
     * @param {string} params.to - Recipient email
     * @param {string} params.subject - Email subject
     * @param {string} params.body - Email body (plain text)
     * @returns {Promise<Object>} { success, messageId, error }
     */
    async sendEmail({ to, subject, body }) {
        const token = await this.getAuthToken();

        // If no token, use dummy mode
        if (!token || token === 'dummy') {
            return this.dummySend({ to, subject, body });
        }

        try {
            const rawMessage = this.createRawMessage({ to, subject, body });

            const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ raw: rawMessage })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                messageId: data.id,
                error: null
            };
        } catch (error) {
            console.error('[LinkedIn Outreach] Gmail send error:', error);
            return {
                success: false,
                messageId: null,
                error: error.message
            };
        }
    },

    /**
     * Create RFC 2822 formatted email encoded in base64url
     */
    createRawMessage({ to, subject, body }) {
        const email = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body
        ].join('\r\n');

        // Base64url encode
        return btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    },

    /**
     * Get OAuth token via chrome.identity
     */
    async getAuthToken() {
        return new Promise((resolve) => {
            try {
                chrome.identity.getAuthToken({ interactive: false }, (token) => {
                    if (chrome.runtime.lastError || !token) {
                        resolve('dummy');
                    } else {
                        resolve(token);
                    }
                });
            } catch {
                resolve('dummy');
            }
        });
    },

    /**
     * Request interactive OAuth token
     */
    async requestAuth() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(token);
                }
            });
        });
    },

    dummySend({ to, subject, body }) {
        console.log('[LinkedIn Outreach] DUMMY EMAIL SEND:');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', body);
        return {
            success: true,
            messageId: 'dummy-' + Date.now(),
            error: null,
            isDummy: true
        };
    }
};

if (typeof window !== 'undefined') {
    window.Gmail = Gmail;
}
