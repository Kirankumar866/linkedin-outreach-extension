// Gemini AI Integration — Message Generation
// Uses dummy data for now; swap with real Gemini API key later

const AI = {
    /**
     * Generate a personalized outreach message
     * @param {Object} params
     * @param {Object} params.profile - Scraped profile data
     * @param {Object} params.job - Job posting data (optional)
     * @param {Object} params.userInfo - User's own profile from settings
     * @param {string} params.mode - 'job' or 'networking'
     * @param {string} params.tone - 'professional', 'semi-casual', or 'casual'
     * @returns {Promise<string>} Generated message
     */
    async generateMessage({ profile, job, userInfo, mode = 'job', tone = 'professional' }) {
        const apiKey = await this.getApiKey();

        const prompt = this.buildPrompt({ profile, job, userInfo, mode, tone });

        // If no API key, return dummy message
        if (!apiKey || apiKey === '' || apiKey === 'dummy') {
            return this.getDummyMessage({ profile, job, userInfo, mode });
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1024
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate message.';
        } catch (error) {
            console.error('[LinkedIn Outreach] AI generation error:', error);
            return this.getDummyMessage({ profile, job, userInfo, mode });
        }
    },

    buildPrompt({ profile, job, userInfo, mode, tone }) {
        const toneGuide = {
            professional: 'formal and polished, suitable for corporate communication',
            'semi-casual': 'warm and approachable while remaining professional',
            casual: 'friendly and conversational, like messaging a colleague'
        };

        let prompt = `You are an expert career coach helping write a personalized outreach email.

TONE: ${toneGuide[tone] || toneGuide.professional}

ABOUT THE SENDER:
- Name: ${userInfo.name || 'Not provided'}
- Current Role: ${userInfo.role || 'Not provided'}
- Company: ${userInfo.company || 'Not provided'}
- Education: ${userInfo.education || 'Not provided'}
- Skills: ${userInfo.skills || 'Not provided'}
- Background Summary: ${userInfo.summary || 'Not provided'}

ABOUT THE RECIPIENT:
- Name: ${profile.name || 'Unknown'}
- Headline: ${profile.headline || 'Not available'}
- About: ${profile.about || 'Not available'}
- Experience: ${JSON.stringify(profile.experience?.slice(0, 3) || [])}
- Education: ${JSON.stringify(profile.education?.slice(0, 2) || [])}
- Skills: ${(profile.skills || []).join(', ') || 'Not available'}
`;

        if (mode === 'job') {
            prompt += `
OUTREACH TYPE: Job Application / Referral Request

TARGET POSITION:
- Job Title: ${job?.jobTitle || 'Not specified'}
- Company: ${job?.company || 'Not specified'}
- Job Description: ${job?.description || 'Not provided'}

Write an email following this structure:
1. APPRECIATION: Reference a specific accomplishment or aspect of their career that you genuinely admire
2. SELF-INTRODUCTION: Brief intro of the sender with relevant background
3. POSITION INTEREST: Express interest in the specific role at their company
4. ASK: Politely ask for a referral, career guidance, or an informational chat

Keep the email under 200 words. Do NOT include a subject line. Start with a greeting using their first name.`;
        } else {
            prompt += `
OUTREACH TYPE: Professional Networking

Write an email following this structure:
1. APPRECIATION: Reference a specific accomplishment or aspect of their career that you genuinely admire
2. SELF-INTRODUCTION: Brief intro of the sender with relevant background
3. COMMON GROUND: Highlight shared interests, skills, or industry connections
4. ASK: Express interest in connecting or ask for advice on a specific topic

Keep the email under 200 words. Do NOT include a subject line. Start with a greeting using their first name.`;
        }

        return prompt;
    },

    getDummyMessage({ profile, job, userInfo, mode }) {
        const firstName = (profile.name || 'there').split(' ')[0];
        const senderName = userInfo?.name || 'Alex';

        if (mode === 'job') {
            return `Hi ${firstName},

I came across your profile and was truly impressed by your journey${profile.headline ? ` as a ${profile.headline}` : ''}. Your experience${profile.experience?.[0]?.company ? ` at ${profile.experience[0].company}` : ''} is really inspiring.

My name is ${senderName}${userInfo?.role ? `, and I'm currently a ${userInfo.role}` : ''}${userInfo?.company ? ` at ${userInfo.company}` : ''}. ${userInfo?.summary || 'I am passionate about technology and innovation.'}

I recently came across ${job?.jobTitle ? `the ${job.jobTitle} position` : 'an exciting opportunity'}${job?.company ? ` at ${job.company}` : ''} and I'm very interested in the role. Given your experience, I would love to hear your insights about the team and culture.

Would you be open to a brief conversation or could you point me in the right direction? I'd truly appreciate any guidance you could offer.

Best regards,
${senderName}`;
        } else {
            return `Hi ${firstName},

I've been following your work${profile.headline ? ` in ${profile.headline}` : ''} and I'm really impressed by what you've accomplished${profile.experience?.[0]?.company ? ` at ${profile.experience[0].company}` : ''}.

My name is ${senderName}${userInfo?.role ? `, a ${userInfo.role}` : ''}${userInfo?.company ? ` at ${userInfo.company}` : ''}. ${userInfo?.summary || 'I share a passion for the same field and would love to connect.'}

${profile.skills?.length ? `I noticed we share expertise in ${profile.skills.slice(0, 3).join(', ')}, and I'd love to exchange ideas.` : 'I believe we share similar professional interests and could learn a lot from each other.'}

Would you be open to connecting for a quick virtual coffee chat? I'd love to hear about your experiences and insights.

Warm regards,
${senderName}`;
        }
    },

    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['geminiApiKey'], (result) => {
                resolve(result.geminiApiKey || 'dummy');
            });
        });
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AI = AI;
}
