const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

async function getGeminiResponse(prompt, options = {}) {
    const { headless = true, timeout = 120000, imagePath = null } = options;

    const userDataDir = path.resolve(__dirname, 'browser-data');

    if (!fs.existsSync(userDataDir)) {
        throw new Error('No browser profile found. Run: npm run save-session');
    }

    // Validate image if provided
    if (imagePath) {
        const resolvedImagePath = path.resolve(imagePath);
        if (!fs.existsSync(resolvedImagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        const mimeType = mime.lookup(resolvedImagePath);
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!mimeType || !validImageTypes.includes(mimeType)) {
            throw new Error(`Invalid image format. Supported: JPG, PNG, GIF, WEBP`);
        }
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
        bypassCSP: true,
        acceptDownloads: true
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

        // Upload image if provided
        if (imagePath) {
            console.log('Starting image upload process...');

            const resolvedImagePath = path.resolve(imagePath);
            let imageUploaded = false;

            try {
                // Step 1: Find and click the main upload menu button
                console.log('Step 1: Looking for upload menu button...');

                const allButtons = await page.$$('button, [role="button"]');
                let menuButton = null;

                for (const button of allButtons) {
                    const ariaLabel = await button.getAttribute('aria-label');
                    if (ariaLabel && ariaLabel.toLowerCase().includes('upload file menu')) {
                        menuButton = button;
                        console.log('Found upload menu button');
                        break;
                    }
                }

                if (!menuButton) {
                    // Try alternative selectors
                    for (const button of allButtons) {
                        const ariaLabel = await button.getAttribute('aria-label');
                        if (ariaLabel && (ariaLabel.toLowerCase().includes('add') || ariaLabel.toLowerCase().includes('upload'))) {
                            menuButton = button;
                            console.log(`Found potential upload button: ${ariaLabel}`);
                            break;
                        }
                    }
                }

                if (menuButton) {
                    // Set up file chooser listener BEFORE clicking anything
                    console.log('Setting up file chooser listener...');
                    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });

                    // Click the menu button
                    console.log('Clicking upload menu button...');
                    await menuButton.click();
                    await page.waitForTimeout(1500);

                    // Step 2: Find and click "Upload files" option in the menu
                    console.log('Step 2: Looking for "Upload files" option...');

                    const menuButtons = await page.$$('button, [role="menuitem"], [role="button"]');
                    let uploadFilesButton = null;

                    for (const button of menuButtons) {
                        const text = await button.textContent();
                        const ariaLabel = await button.getAttribute('aria-label');

                        if ((text && text.toLowerCase().includes('upload files')) ||
                            (text && text.toLowerCase().includes('upload from computer')) ||
                            (ariaLabel && ariaLabel.toLowerCase().includes('upload files'))) {
                            uploadFilesButton = button;
                            console.log(`Found upload files button: ${text || ariaLabel}`);
                            break;
                        }
                    }

                    if (uploadFilesButton) {
                        console.log('Clicking "Upload files" button...');
                        await uploadFilesButton.click();

                        try {
                            // Wait for the file chooser
                            console.log('Waiting for file chooser dialog...');
                            const fileChooser = await fileChooserPromise;

                            console.log('File chooser appeared! Selecting file...');
                            await fileChooser.setFiles(resolvedImagePath);

                            console.log('✓ Image uploaded successfully!');
                            imageUploaded = true;

                            // Wait for upload to complete
                            await page.waitForTimeout(4000);

                            // Verify upload by checking for image preview
                            const imagePreview = await page.$('img[src^="blob:"], img[src^="data:"]');
                            if (imagePreview) {
                                console.log('✓ Image preview detected - upload confirmed');
                            }
                        } catch (fcError) {
                            console.log('File chooser timeout:', fcError.message);
                        }
                    } else {
                        console.log('Could not find "Upload files" button in menu');
                    }
                } else {
                    console.log('Could not find upload menu button');
                }

            } catch (e) {
                console.log('Upload process error:', e.message);
            }

            // Fallback: Try direct file input method
            if (!imageUploaded) {
                try {
                    console.log('Fallback: Trying direct file input method...');

                    // Look for any file inputs on the page
                    const fileInputs = await page.$$('input[type="file"]');
                    console.log(`Found ${fileInputs.length} file inputs on page`);

                    if (fileInputs.length > 0) {
                        // Try to set files on all inputs
                        for (let i = 0; i < fileInputs.length; i++) {
                            try {
                                await fileInputs[i].setInputFiles(resolvedImagePath);
                                console.log(`✓ Image set on file input ${i + 1}`);
                                imageUploaded = true;
                                await page.waitForTimeout(3000);
                                break;
                            } catch (e) {
                                console.log(`File input ${i + 1} not accessible`);
                            }
                        }
                    }
                } catch (e) {
                    console.log('Fallback method failed:', e.message);
                }
            }

            // Last resort: Click menu and wait for manual upload
            if (!imageUploaded) {
                try {
                    console.log('\nTrying to open upload menu for manual upload...');
                    const allButtons = await page.$$('button, [role="button"]');

                    for (const button of allButtons) {
                        const ariaLabel = await button.getAttribute('aria-label');
                        if (ariaLabel && ariaLabel.toLowerCase().includes('upload file menu')) {
                            await button.click();
                            break;
                        }
                    }
                } catch (e) {
                    // Ignore
                }

                console.warn('\n⚠ AUTOMATIC UPLOAD FAILED');
                console.warn('The upload menu should be open now.');
                console.warn('Please manually click "Upload files" and select your image.');
                console.warn('You have 20 seconds...\n');
                await page.waitForTimeout(20000);
            }
        }

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

        const sendButtonSelectors = [
            'button[aria-label*="send" i]',
            'button[aria-label*="submit" i]',
            'button.send-button',
            'button[type="submit"]'
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
                        console.log('Send button clicked');
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        if (!buttonClicked) {
            await page.keyboard.press('Enter');
            console.log('Pressed Enter');
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
            imagePath: imagePath || null,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        await browser.close();
        throw new Error(`Failed: ${error.message}`);
    }
}

module.exports = { getGeminiResponse };
