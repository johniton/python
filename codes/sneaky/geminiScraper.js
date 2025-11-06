const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function getGeminiResponse(prompt, options = {}) {
    const { headless = true, timeout = 120000 } = options;

    const userDataDir = path.resolve(__dirname, 'browser-data');

    if (!fs.existsSync(userDataDir)) {
        throw new Error('No browser profile found. Run: npm run save-session');
    }

    // Find browser executable
    let executablePath = undefined;
    const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ];

    for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
            executablePath = chromePath;
            break;
        }
    }

    console.log('Launching browser...');

    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: headless,
        executablePath: executablePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--window-size=1920,1080',
            '--disable-extensions',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
        bypassCSP: true
    });

    const page = browser.pages()[0] || await browser.newPage();

    // Anti-detection
    await page.addInitScript(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => {
                return Object.create(PluginArray.prototype, {
                    length: { value: 3 }
                });
            }
        });

        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        });

        window.chrome = {
            runtime: {},
            loadTimes: function() { },
            csi: function() { },
            app: {}
        };
    });

    try {
        console.log('Navigating to Gemini...');
        await page.goto('https://gemini.google.com/app', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        await page.waitForTimeout(5000);

        console.log('Finding chat input...');

        const inputSelectors = [
            'div.ql-editor.textarea[contenteditable="true"]',
            'rich-textarea div.ql-editor',
            'div[contenteditable="true"][data-placeholder]',
            'div.ql-editor[role="textbox"]',
            'div[contenteditable="true"]'
        ];

        let inputSelector = null;
        for (const selector of inputSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000, state: 'visible' });
                inputSelector = selector;
                console.log(`Found input: ${selector}`);
                break;
            } catch (e) {
                continue;
            }
        }

        if (!inputSelector) {
            throw new Error('Chat input not found. Try running save-session again.');
        }

        await page.click(inputSelector);
        await page.waitForTimeout(1000);

        console.log('Typing prompt...');
        for (const char of prompt) {
            await page.keyboard.type(char);
            await page.waitForTimeout(Math.random() * 150 + 50);
        }

        await page.waitForTimeout(500);

        console.log('Sending...');
        await page.keyboard.press('Enter');

        await page.waitForTimeout(4000);

        console.log('Waiting for response...');

        let response = '';
        let stableCount = 0;
        let previousText = '';

        for (let attempt = 0; attempt < 90; attempt++) {
            try {
                const responseElements = await page.$$('model-response message-content, .response-container, message-content');

                if (responseElements.length > 0) {
                    const lastResponse = responseElements[responseElements.length - 1];
                    const currentText = await lastResponse.innerText();

                    if (currentText && currentText.length > 0) {
                        if (currentText === previousText) {
                            stableCount++;
                            if (stableCount >= 5) {
                                response = currentText;
                                console.log('Response complete!');
                                break;
                            }
                        } else {
                            stableCount = 0;
                            previousText = currentText;
                        }
                    }
                }
            } catch (e) {
                // Continue
            }

            await page.waitForTimeout(1000);
        }

        if (!response || response.length === 0) {
            try {
                response = await page.evaluate(() => {
                    const containers = document.querySelectorAll('message-content, model-response');
                    if (containers.length > 0) {
                        return containers[containers.length - 1].innerText;
                    }
                    return '';
                });
            } catch (e) {
                throw new Error('Could not extract response');
            }
        }

        await browser.close();

        return {
            success: true,
            prompt: prompt,
            response: response.trim(),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        await browser.close();
        throw new Error(`Failed: ${error.message}`);
    }
}

module.exports = { getGeminiResponse };
