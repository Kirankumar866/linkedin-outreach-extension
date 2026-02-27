// LinkedIn Job Scraper — Content Script
// Scrapes job posting data from LinkedIn job pages

(function () {
    'use strict';

    function isJobPage() {
        return window.location.pathname.includes('/jobs/') ||
            window.location.pathname.includes('/job/');
    }

    function scrapeJobPosting() {
        const data = {
            jobTitle: '',
            company: '',
            location: '',
            description: '',
            jobUrl: window.location.href
        };

        try {
            // Job Title
            const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
                document.querySelector('.jobs-unified-top-card__job-title') ||
                document.querySelector('.t-24.t-bold.inline');
            if (titleEl) data.jobTitle = titleEl.innerText.trim();

            // Company Name
            const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
                document.querySelector('.jobs-unified-top-card__company-name a') ||
                document.querySelector('.jobs-unified-top-card__subtitle-primary-grouping .t-black span');
            if (companyEl) data.company = companyEl.innerText.trim();

            // Location
            const locationEl = document.querySelector('.job-details-jobs-unified-top-card__bullet') ||
                document.querySelector('.jobs-unified-top-card__bullet');
            if (locationEl) data.location = locationEl.innerText.trim();

            // Job Description (first 500 chars)
            const descEl = document.querySelector('.jobs-description__content .jobs-box__html-content') ||
                document.querySelector('.jobs-description-content__text') ||
                document.querySelector('#job-details');
            if (descEl) data.description = descEl.innerText.trim().substring(0, 500);

        } catch (err) {
            console.warn('[LinkedIn Outreach] Job scrape error:', err);
        }

        return data;
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'scrapeJob') {
            if (isJobPage()) {
                const jobData = scrapeJobPosting();
                sendResponse({ success: true, data: jobData });
            } else {
                sendResponse({ success: false, error: 'Not on a LinkedIn job page' });
            }
        }
        return true;
    });

    // Auto-scrape job posting and save for later use
    if (isJobPage()) {
        setTimeout(() => {
            const jobData = scrapeJobPosting();
            if (jobData.jobTitle || jobData.company) {
                chrome.storage.local.set({ lastScrapedJob: jobData }, () => {
                    console.log('[LinkedIn Outreach] Job auto-scraped:', jobData.jobTitle, '@', jobData.company);
                });
            }
        }, 2000);
    }
})();
