// OutreachAI — Options Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const $ = (sel) => document.querySelector(sel);

    const els = {
        // API Keys
        geminiKey: $('#geminiKey'),
        hunterKey: $('#hunterKey'),
        // Gmail
        connectGmailBtn: $('#connectGmailBtn'),
        disconnectGmailBtn: $('#disconnectGmailBtn'),
        gmailIndicator: $('#gmailIndicator'),
        gmailStatusText: $('#gmailStatusText'),
        // Profile
        userName: $('#userName'),
        userRole: $('#userRole'),
        userCompany: $('#userCompany'),
        userEducation: $('#userEducation'),
        userSkills: $('#userSkills'),
        userSummary: $('#userSummary'),
        // Preferences
        defaultTone: $('#defaultTone'),
        defaultMode: $('#defaultMode'),
        // Actions
        saveBtn: $('#saveBtn'),
        resetBtn: $('#resetBtn'),
        // Status
        settingsStatus: $('#settingsStatus')
    };

    // ===================== Init =====================
    loadSettings();
    checkGmailConnection();
    setupListeners();

    // ===================== Load/Save =====================

    function loadSettings() {
        chrome.storage.sync.get(null, (data) => {
            els.geminiKey.value = data.geminiApiKey || '';
            els.hunterKey.value = data.hunterApiKey || '';
            els.userName.value = data.userName || '';
            els.userRole.value = data.userRole || '';
            els.userCompany.value = data.userCompany || '';
            els.userEducation.value = data.userEducation || '';
            els.userSkills.value = data.userSkills || '';
            els.userSummary.value = data.userSummary || '';
            els.defaultTone.value = data.defaultTone || 'professional';
            els.defaultMode.value = data.defaultMode || 'job';
        });
    }

    function saveSettings() {
        const settings = {
            geminiApiKey: els.geminiKey.value.trim(),
            hunterApiKey: els.hunterKey.value.trim(),
            userName: els.userName.value.trim(),
            userRole: els.userRole.value.trim(),
            userCompany: els.userCompany.value.trim(),
            userEducation: els.userEducation.value.trim(),
            userSkills: els.userSkills.value.trim(),
            userSummary: els.userSummary.value.trim(),
            defaultTone: els.defaultTone.value,
            defaultMode: els.defaultMode.value
        };

        chrome.storage.sync.set(settings, () => {
            showStatus('Settings saved successfully!', 'success');
        });
    }

    function resetSettings() {
        if (!confirm('Reset all settings to defaults? This will clear your API keys and profile.')) return;

        chrome.storage.sync.clear(() => {
            loadSettings();
            showStatus('Settings reset to defaults', 'success');
        });
    }

    // ===================== Gmail =====================

    function checkGmailConnection() {
        try {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    setGmailStatus(false);
                } else {
                    setGmailStatus(true);
                }
            });
        } catch {
            setGmailStatus(false);
        }
    }

    function setGmailStatus(connected) {
        if (connected) {
            els.gmailIndicator.className = 'indicator connected';
            els.gmailStatusText.textContent = 'Connected to Gmail';
            els.connectGmailBtn.classList.add('hidden');
            els.disconnectGmailBtn.classList.remove('hidden');
        } else {
            els.gmailIndicator.className = 'indicator disconnected';
            els.gmailStatusText.textContent = 'Not connected';
            els.connectGmailBtn.classList.remove('hidden');
            els.disconnectGmailBtn.classList.add('hidden');
        }
    }

    function connectGmail() {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                showStatus('Gmail connection failed: ' + chrome.runtime.lastError.message, 'error');
            } else if (token) {
                setGmailStatus(true);
                showStatus('Gmail connected successfully!', 'success');
            }
        });
    }

    function disconnectGmail() {
        chrome.runtime.sendMessage({ action: 'revokeAuthToken' }, (response) => {
            setGmailStatus(false);
            showStatus('Gmail disconnected', 'success');
        });
    }

    // ===================== UI Helpers =====================

    function showStatus(message, type) {
        els.settingsStatus.textContent = message;
        els.settingsStatus.className = `settings-status ${type}`;
        setTimeout(() => {
            els.settingsStatus.classList.add('hidden');
        }, 4000);
    }

    // ===================== Event Listeners =====================

    function setupListeners() {
        els.saveBtn.addEventListener('click', saveSettings);
        els.resetBtn.addEventListener('click', resetSettings);
        els.connectGmailBtn.addEventListener('click', connectGmail);
        els.disconnectGmailBtn.addEventListener('click', disconnectGmail);

        // Toggle password visibility
        document.querySelectorAll('.toggle-vis').forEach((btn) => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    }
});
