// Hunter.io Email Finder Integration
// Uses dummy data for now; swap with real Hunter.io API key later

const Hunter = {
    /**
     * Find a professional email address
     * @param {string} firstName
     * @param {string} lastName
     * @param {string} companyDomain - e.g., "google.com"
     * @returns {Promise<Object>} { email, confidence, source }
     */
    async findEmail(firstName, lastName, companyDomain) {
        const apiKey = await this.getApiKey();

        // If no API key, return dummy data
        if (!apiKey || apiKey === '' || apiKey === 'dummy') {
            return this.getDummyEmail(firstName, lastName, companyDomain);
        }

        try {
            const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(companyDomain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${apiKey}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Hunter.io API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.data && data.data.email) {
                return {
                    email: data.data.email,
                    confidence: data.data.confidence || 0,
                    source: 'hunter.io',
                    found: true
                };
            } else {
                return {
                    email: '',
                    confidence: 0,
                    source: 'hunter.io',
                    found: false,
                    message: 'No email found for this person'
                };
            }
        } catch (error) {
            console.error('[LinkedIn Outreach] Hunter.io error:', error);
            return this.getDummyEmail(firstName, lastName, companyDomain);
        }
    },

    /**
     * Guess a company domain from the company name
     * @param {string} companyName
     * @returns {string} guessed domain
     */
    guessDomain(companyName) {
        if (!companyName) return '';
        // Simple heuristic: lowercase, remove common suffixes, add .com
        return companyName
            .toLowerCase()
            .replace(/\s*(inc\.?|corp\.?|ltd\.?|llc\.?|co\.?|group|international|technologies|technology|tech|solutions)\s*/gi, '')
            .replace(/[^a-z0-9]/g, '')
            .trim() + '.com';
    },

    getDummyEmail(firstName, lastName, companyDomain) {
        const domain = companyDomain || 'company.com';
        const fName = (firstName || 'john').toLowerCase();
        const lName = (lastName || 'doe').toLowerCase();
        return {
            email: `${fName}.${lName}@${domain}`,
            confidence: 85,
            source: 'dummy (no API key)',
            found: true
        };
    },

    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['hunterApiKey'], (result) => {
                resolve(result.hunterApiKey || 'dummy');
            });
        });
    }
};

if (typeof window !== 'undefined') {
    window.Hunter = Hunter;
}
