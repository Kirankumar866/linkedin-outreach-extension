// LinkedIn Profile Scraper — Content Script
// Scrapes profile data from LinkedIn profile pages

(function () {
    'use strict';

    function isProfilePage() {
        return window.location.pathname.startsWith('/in/');
    }

    function scrapeProfile() {
        const data = {
            name: '',
            headline: '',
            about: '',
            location: '',
            experience: [],
            education: [],
            skills: [],
            profileUrl: window.location.href
        };

        try {
            // Name
            const nameEl = document.querySelector('h1.text-heading-xlarge') ||
                document.querySelector('.pv-top-card--list li') ||
                document.querySelector('h1');
            if (nameEl) data.name = nameEl.innerText.trim();

            // Headline
            const headlineEl = document.querySelector('.text-body-medium.break-words') ||
                document.querySelector('.pv-top-card--list + .text-body-medium');
            if (headlineEl) data.headline = headlineEl.innerText.trim();

            // Location
            const locationEl = document.querySelector('.pv-top-card--list-bullet .text-body-small') ||
                document.querySelector('span.text-body-small[class*="inline"]');
            if (locationEl) data.location = locationEl.innerText.trim();

            // About
            const aboutSection = document.querySelector('#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]') ||
                document.querySelector('.pv-about-section .pv-about__summary-text') ||
                document.querySelector('section.pv-about-section .inline-show-more-text');
            if (aboutSection) data.about = aboutSection.innerText.trim();

            // Experience
            const experienceItems = document.querySelectorAll('#experience ~ .pvs-list__outer-container .pvs-entity--padded');
            experienceItems.forEach((item, i) => {
                if (i >= 5) return; // Limit to 5 entries
                const title = item.querySelector('.t-bold span[aria-hidden="true"]');
                const company = item.querySelector('.t-normal span[aria-hidden="true"]');
                const duration = item.querySelector('.pvs-entity__caption-wrapper span[aria-hidden="true"]');
                data.experience.push({
                    title: title ? title.innerText.trim() : '',
                    company: company ? company.innerText.trim() : '',
                    duration: duration ? duration.innerText.trim() : ''
                });
            });

            // Education
            const educationItems = document.querySelectorAll('#education ~ .pvs-list__outer-container .pvs-entity--padded');
            educationItems.forEach((item, i) => {
                if (i >= 3) return;
                const school = item.querySelector('.t-bold span[aria-hidden="true"]');
                const degree = item.querySelector('.t-normal span[aria-hidden="true"]');
                data.education.push({
                    school: school ? school.innerText.trim() : '',
                    degree: degree ? degree.innerText.trim() : ''
                });
            });

            // Skills
            const skillItems = document.querySelectorAll('#skills ~ .pvs-list__outer-container .pvs-entity--padded .t-bold span[aria-hidden="true"]');
            skillItems.forEach((item, i) => {
                if (i >= 10) return;
                data.skills.push(item.innerText.trim());
            });

        } catch (err) {
            console.warn('[LinkedIn Outreach] Profile scrape error:', err);
        }

        return data;
    }

    // Listen for messages from popup requesting profile data
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'scrapeProfile') {
            if (isProfilePage()) {
                const profileData = scrapeProfile();
                sendResponse({ success: true, data: profileData });
            } else {
                sendResponse({ success: false, error: 'Not on a LinkedIn profile page' });
            }
        }
        return true; // Keep message channel open for async response
    });

    // Auto-scrape when navigating to a profile page and store in chrome.storage
    if (isProfilePage()) {
        setTimeout(() => {
            const profileData = scrapeProfile();
            chrome.storage.local.set({ lastScrapedProfile: profileData }, () => {
                console.log('[LinkedIn Outreach] Profile auto-scraped:', profileData.name);
            });
        }, 2000); // Wait for page to fully render
    }
})();
