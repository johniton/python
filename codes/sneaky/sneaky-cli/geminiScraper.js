const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

function getLatestImageFromDownloads() {
    const downloadsPath = path.join(os.homedir(), 'Downloads');

    if (!fs.existsSync(downloadsPath)) {
        throw new Error('Downloads folder not found');
    }

    const files = fs.readdirSync(downloadsPath);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    if (imageFiles.length === 0) {
        throw new Error('No images found in Downloads folder');
    }

    // Get file stats and sort by modification time
    const fileStats = imageFiles.map(file => {
        const filePath = path.join(downloadsPath, file);
        return {
            path: filePath,
            mtime: fs.statSync(filePath).mtime
        };
    });

    fileStats.sort((a, b) => b.mtime - a.mtime);

    console.log(`Latest image: ${path.basename(fileStats[0].path)}`);
    return fileStats[0].path;
}

async function getGeminiResponse(prompt, options = {}) {
    const { headless = true, timeout = 120000, imagePath = null, useLatest = false } = options;

    let finalImagePath = null;

    if (useLatest) {
        finalImagePath = getLatestImageFromDownloads();
    } else if (imagePath) {
        finalImagePath = path.resolve(imagePath);
        if (!fs.existsSync(finalImagePath)) {
            throw new Error(`Image not found: ${imagePath}`);
        }
    }

    const userDataDir = path.resolve(__dirname, 'browser-data');

    if (!fs.existsSync(userDataDir)) {
        throw new Error('No browser profile. Run: npm run save-session');
    }

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
            '--window-size=1920,1080'
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        ignoreDefaultArgs: ['--enable-automation'],
        bypassCSP: true,
        acceptDownloads: true
    });

    const page = browser.pages()[0] || await browser.newPage();

    await page.addInitScript(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => Object.create(PluginArray.prototype, { length: { value: 3 } })
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

        if (finalImagePath) {
            console.log('Uploading image...');
            let imageUploaded = false;

            try {
                const allButtons = await page.$$('button, [role="button"]');
                let menuButton = null;

                for (const button of allButtons) {
                    const ariaLabel = await button.getAttribute('aria-label');
                    if (ariaLabel && ariaLabel.toLowerCase().includes('upload file menu')) {
                        menuButton = button;
                        break;
                    }
                }

                if (menuButton) {
                    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
                    await menuButton.click();
                    await page.waitForTimeout(1500);

                    const menuButtons = await page.$$('button, [role="menuitem"], [role="button"]');
                    let uploadFilesButton = null;

                    for (const button of menuButtons) {
                        const text = await button.textContent();
                        const ariaLabel = await button.getAttribute('aria-label');

                        if ((text && text.toLowerCase().includes('upload files')) ||
                            (ariaLabel && ariaLabel.toLowerCase().includes('upload files'))) {
                            uploadFilesButton = button;
                            break;
                        }
                    }

                    if (uploadFilesButton) {
                        await uploadFilesButton.click();
                        const fileChooser = await fileChooserPromise;
                        await fileChooser.setFiles(finalImagePath);
                        console.log('✓ Image uploaded!');
                        imageUploaded = true;
                        await page.waitForTimeout(4000);
                    }
                }
            } catch (e) {
                console.log('Upload error:', e.message);
            }

            if (!imageUploaded) {
                throw new Error('Failed to upload image');
            }
        }

        console.log('Finding chat input...');
        const inputSelectors = [
            'div.ql-editor.textarea[contenteditable="true"]',
            'rich-textarea div.ql-editor',
            'div[contenteditable="true"]'
        ];

        let inputSelector = null;
        for (const selector of inputSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000, state: 'visible' });
                inputSelector = selector;
                break;
            } catch (e) {
                continue;
            }
        }

        if (!inputSelector) {
            throw new Error('Chat input not found');
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
        const sendButtonSelectors = [
            'button[aria-label*="send" i]',
            'button[aria-label*="submit" i]'
        ];

        let buttonClicked = false;
        for (const selector of sendButtonSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    const isDisabled = await button.evaluate(el => el.disabled || el.getAttribute('aria-disabled') === 'true');
                    if (!isDisabled) {
                        await button.click();
                        buttonClicked = true;
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        if (!buttonClicked) {
            await page.keyboard.press('Enter');
        }

        await page.waitForTimeout(4000);

        console.log('Waiting for response...');
        let response = '';
        let stableCount = 0;
        let previousText = '';

        for (let attempt = 0; attempt < 120; attempt++) {
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

        await browser.close();

        return {
            success: true,
            prompt: prompt,
            response: response.trim(),
            imagePath: finalImagePath || null,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        await browser.close();
        throw error;
    }
}

module.exports = { getGeminiResponse };
