const BrowserHelper = require('../utils/browserHelper');
const ImageHelper = require('../utils/imageHelper');
const config = require('../config');

class GeminiScraper {
    async scrape(prompt, options = {}) {
        const {
            imagePath = null,
            imageBuffer = null,
            useLatestDownload = false,
            headless = config.browser.headless,
            timeout = config.browser.timeout
        } = options;

        let finalImagePath = null;
        let tempFile = null;

        try {
            // Determine image source
            if (useLatestDownload) {
                const latestImage = ImageHelper.getLatestImageFromDownloads();
                finalImagePath = latestImage.path;
                console.log(`Using latest download: ${latestImage.name}`);
            } else if (imageBuffer) {
                tempFile = ImageHelper.saveBufferToTemp(imageBuffer, options.imageName);
                finalImagePath = tempFile;
                console.log(`Using buffer image: ${tempFile}`);
            } else if (imagePath) {
                const fs = require('fs');
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image not found: ${imagePath}`);
                }
                finalImagePath = imagePath;
                console.log(`Using file path: ${imagePath}`);
            }

            console.log('Launching browser...');
            const browser = await BrowserHelper.createBrowserContext(headless);
            const page = browser.pages()[0] || await browser.newPage();

            await BrowserHelper.addStealthScripts(page);

            console.log('Navigating to Gemini...');
            await page.goto('https://gemini.google.com/app', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            await page.waitForTimeout(5000);

            // Upload image if present
            if (finalImagePath) {
                await this.uploadImage(page, finalImagePath);
            }

            // Type and send prompt
            await this.sendPrompt(page, prompt);

            // Get response
            const response = await this.getResponse(page, timeout);

            await browser.close();

            // Cleanup temp file
            if (tempFile) {
                ImageHelper.deleteFile(tempFile);
            }

            return {
                success: true,
                prompt: prompt,
                response: response.trim(),
                imagePath: finalImagePath || null,
                imageUsed: !!finalImagePath,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            if (tempFile) {
                ImageHelper.deleteFile(tempFile);
            }
            throw error;
        }
    }

    async uploadImage(page, imagePath) {
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
                    await fileChooser.setFiles(imagePath);
                    console.log('✓ Image uploaded successfully!');
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

    async sendPrompt(page, prompt) {
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
                    const isDisabled = await button.evaluate(el =>
                        el.disabled || el.getAttribute('aria-disabled') === 'true'
                    );
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
    }

    async getResponse(page, timeout) {
        console.log('Waiting for response...');
        let response = '';
        let stableCount = 0;
        let previousText = '';

        const maxAttempts = Math.floor(timeout / 1000);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const responseElements = await page.$$(
                    'model-response message-content, .response-container, message-content'
                );

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

        if (!response) {
            throw new Error('No response received from Gemini');
        }

        return response;
    }
}

module.exports = new GeminiScraper();
