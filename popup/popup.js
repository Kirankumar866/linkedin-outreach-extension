// LinkedIn Outreach Assistant — Popup Logic
// Orchestrates scraping, email lookup, AI generation, and email sending

document.addEventListener('DOMContentLoaded', () => {
    // ===================== DOM Elements =====================
    const $ = (sel) => document.querySelector(sel);

    const els = {
        // Status
        statusBar: $('#statusBar'),
        statusText: $('#statusText'),
        // Profile
        profileName: $('#profileName'),
        profileHeadline: $('#profileHeadline'),
        profileCompany: $('#profileCompany'),
        profileAbout: $('#profileAbout'),
        scrapeBtn: $('#scrapeBtn'),
        // Mode
        modeJob: $('#modeJob'),
        modeNetwork: $('#modeNetwork'),
        jobSection: $('#jobSection'),
        // Job
        jobTitle: $('#jobTitle'),
        jobCompany: $('#jobCompany'),
        // Email
        recipientEmail: $('#recipientEmail'),
        findEmailBtn: $('#findEmailBtn'),
        emailSubject: $('#emailSubject'),
        toneSelect: $('#toneSelect'),
        // Message
        messageBody: $('#messageBody'),
        copyBtn: $('#copyBtn'),
        // Actions
        generateBtn: $('#generateBtn'),
        sendBtn: $('#sendBtn'),
        settingsBtn: $('#settingsBtn')
    };

    let currentMode = 'job';
    let fullProfileData = null;

    // ===================== Initialization =====================

    init();

    async function init() {
        loadStoredData();
        setupEventListeners();
    }

    // ===================== Status Bar =====================

    function showStatus(message, type = 'info') {
        els.statusBar.className = `status-bar ${type}`;
        els.statusText.textContent = message;
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                els.statusBar.classList.add('hidden');
            }, 4000);
        }
    }

    function hideStatus() {
        els.statusBar.classList.add('hidden');
    }

    // ===================== Event Listeners =====================

    function setupEventListeners() {
        // Settings
        els.settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        // Scrape
        els.scrapeBtn.addEventListener('click', handleScrape);

        // Mode toggle
        els.modeJob.addEventListener('click', () => setMode('job'));
        els.modeNetwork.addEventListener('click', () => setMode('networking'));

        // Find email
        els.findEmailBtn.addEventListener('click', handleFindEmail);

        // Generate message
        els.generateBtn.addEventListener('click', handleGenerate);

        // Send email
        els.sendBtn.addEventListener('click', handleSend);

        // Copy
        els.copyBtn.addEventListener('click', handleCopy);

        // Enable send button when message has content
        els.messageBody.addEventListener('input', () => {
            els.sendBtn.disabled = !els.messageBody.value.trim();
        });
    }

    // ===================== Mode Toggle =====================

    function setMode(mode) {
        currentMode = mode;
        els.modeJob.classList.toggle('active', mode === 'job');
        els.modeNetwork.classList.toggle('active', mode === 'networking');

        if (mode === 'job') {
            els.jobSection.classList.remove('hidden');
        } else {
            els.jobSection.classList.add('hidden');
        }
    }

    // ===================== Load Stored Data =====================

    function loadStoredData() {
        chrome.storage.local.get(['lastScrapedProfile', 'lastScrapedJob'], (result) => {
            if (result.lastScrapedProfile) {
                populateProfile(result.lastScrapedProfile);
                showStatus('Profile loaded from last visit', 'info');
            }
            if (result.lastScrapedJob) {
                populateJob(result.lastScrapedJob);
            }
        });
    }

    function populateProfile(data) {
        fullProfileData = data;
        els.profileName.value = data.name || '';
        els.profileHeadline.value = data.headline || '';
        els.profileAbout.value = data.about || '';

        // Extract company from experience
        const company = data.experience?.[0]?.company || '';
        els.profileCompany.value = company;
    }

    function populateJob(data) {
        els.jobTitle.value = data.jobTitle || '';
        els.jobCompany.value = data.company || '';
    }

    // ===================== Scrape Profile =====================

    async function handleScrape() {
        els.scrapeBtn.disabled = true;
        showStatus('Scraping profile...', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.url?.includes('linkedin.com')) {
                showStatus('Navigate to a LinkedIn page first', 'warning');
                els.scrapeBtn.disabled = false;
                return;
            }

            // Try profile scrape
            chrome.tabs.sendMessage(tab.id, { action: 'scrapeProfile' }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus('Could not connect to page. Try refreshing.', 'error');
                    els.scrapeBtn.disabled = false;
                    return;
                }

                if (response?.success) {
                    populateProfile(response.data);
                    showStatus(`Scraped: ${response.data.name}`, 'success');
                } else {
                    // Try job scrape
                    chrome.tabs.sendMessage(tab.id, { action: 'scrapeJob' }, (jobResponse) => {
                        if (jobResponse?.success) {
                            populateJob(jobResponse.data);
                            showStatus(`Job scraped: ${jobResponse.data.jobTitle}`, 'success');
                        } else {
                            showStatus('No profile or job data found on this page', 'warning');
                        }
                    });
                }
                els.scrapeBtn.disabled = false;
            });
        } catch (err) {
            showStatus('Scrape failed: ' + err.message, 'error');
            els.scrapeBtn.disabled = false;
        }
    }

    // ===================== Find Email (Hunter.io) =====================

    async function handleFindEmail() {
        const name = els.profileName.value.trim();
        const company = els.profileCompany.value.trim() || els.jobCompany.value.trim();

        if (!name) {
            showStatus('Enter a name to find their email', 'warning');
            return;
        }

        if (!company) {
            showStatus('Enter a company name to find email', 'warning');
            return;
        }

        els.findEmailBtn.disabled = true;
        showStatus('Searching for email...', 'info');

        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        const domain = Hunter.guessDomain(company);

        try {
            const result = await Hunter.findEmail(firstName, lastName, domain);

            if (result.found) {
                els.recipientEmail.value = result.email;

                // Show confidence
                const level = result.confidence >= 80 ? 'high' : result.confidence >= 50 ? 'medium' : 'low';
                showStatus(`Email found (${result.confidence}% confidence) — ${result.source}`, 'success');
            } else {
                showStatus('No email found. Try entering manually.', 'warning');
            }
        } catch (err) {
            showStatus('Email lookup failed: ' + err.message, 'error');
        }

        els.findEmailBtn.disabled = false;
    }

    // ===================== Generate Message =====================

    async function handleGenerate() {
        els.generateBtn.classList.add('loading');
        els.generateBtn.disabled = true;
        showStatus('Generating personalized message...', 'info');

        // Gather user info from settings
        const userInfo = await getUserInfo();

        const profile = {
            name: els.profileName.value,
            headline: els.profileHeadline.value,
            about: els.profileAbout.value,
            experience: fullProfileData?.experience || [],
            education: fullProfileData?.education || [],
            skills: fullProfileData?.skills || []
        };

        const job = {
            jobTitle: els.jobTitle.value,
            company: els.jobCompany.value
        };

        const tone = els.toneSelect.value;

        try {
            const message = await AI.generateMessage({
                profile,
                job,
                userInfo,
                mode: currentMode,
                tone
            });

            els.messageBody.value = message;
            els.sendBtn.disabled = false;
            els.copyBtn.classList.remove('hidden');

            // Auto-generate subject
            if (!els.emailSubject.value) {
                const firstName = profile.name.split(' ')[0];
                if (currentMode === 'job') {
                    els.emailSubject.value = job.jobTitle
                        ? `Regarding ${job.jobTitle} position${job.company ? ` at ${job.company}` : ''}`
                        : `Reaching out about opportunities`;
                } else {
                    els.emailSubject.value = `${firstName ? `Hi ${firstName} — ` : ''}Would love to connect`;
                }
            }

            showStatus('Message generated successfully!', 'success');
        } catch (err) {
            showStatus('Generation failed: ' + err.message, 'error');
        }

        els.generateBtn.classList.remove('loading');
        els.generateBtn.disabled = false;
    }

    // ===================== Send Email =====================

    async function handleSend() {
        const to = els.recipientEmail.value.trim();
        const subject = els.emailSubject.value.trim();
        const body = els.messageBody.value.trim();

        if (!to) {
            showStatus('Enter a recipient email address', 'warning');
            return;
        }

        if (!subject) {
            showStatus('Enter an email subject', 'warning');
            return;
        }

        if (!body) {
            showStatus('Generate a message first', 'warning');
            return;
        }

        els.sendBtn.classList.add('loading');
        els.sendBtn.disabled = true;
        showStatus('Sending email...', 'info');

        try {
            const result = await Gmail.sendEmail({ to, subject, body });

            if (result.success) {
                if (result.isDummy) {
                    showStatus('✓ Dummy send — connect Gmail in Settings for real sends', 'success');
                } else {
                    showStatus('✓ Email sent successfully!', 'success');
                }
            } else {
                showStatus('Send failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showStatus('Send failed: ' + err.message, 'error');
        }

        els.sendBtn.classList.remove('loading');
        els.sendBtn.disabled = false;
    }

    // ===================== Copy to Clipboard =====================

    async function handleCopy() {
        const text = els.messageBody.value;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            showStatus('Copied to clipboard!', 'success');
        } catch {
            // Fallback
            els.messageBody.select();
            document.execCommand('copy');
            showStatus('Copied to clipboard!', 'success');
        }
    }

    // ===================== User Info =====================

    function getUserInfo() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(
                ['userName', 'userRole', 'userCompany', 'userEducation', 'userSkills', 'userSummary'],
                (result) => {
                    resolve({
                        name: result.userName || '',
                        role: result.userRole || '',
                        company: result.userCompany || '',
                        education: result.userEducation || '',
                        skills: result.userSkills || '',
                        summary: result.userSummary || ''
                    });
                }
            );
        });
    }
});
