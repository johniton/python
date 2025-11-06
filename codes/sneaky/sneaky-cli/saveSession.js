const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Starting browser for manual login...');

    const profileDir = path.resolve(__dirname, 'gemini-profile');
    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    const userDataDir = path.resolve(__dirname, 'browser-data');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
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
            console.log(`Using browser: ${chromePath}`);
            break;
        }
    }

    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath: executablePath,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
            '--start-maximized'
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        ignoreDefaultArgs: ['--enable-automation'],
        bypassCSP: true
    });

    const page = browser.pages()[0] || await browser.newPage();

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
        console.log('\nNavigating to Google...');
        await page.goto('https://accounts.google.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('\n' + '='.repeat(60));
        console.log('MANUAL LOGIN REQUIRED');
        console.log('='.repeat(60));
        console.log('\nSteps:');
        console.log('1. Complete Google login in the browser');
        console.log('2. After login, go to: https://gemini.google.com');
        console.log('3. Wait for Gemini chat interface to load');
        console.log('4. Press ENTER here to save session\n');

        await new Promise((resolve) => {
            process.stdin.once('data', resolve);
        });

        console.log('\nSaving session...');
        const storagePath = path.resolve(profileDir, 'state.json');
        const storageState = await page.context().storageState();
        fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2));

        console.log('✓ Session saved at:', storagePath);
        console.log('✓ Browser profile at:', userDataDir);
        console.log('\nReady! Use:');
        console.log('  node index.js "Your prompt"');
        console.log('  node index.js "What is this?" --image photo.jpg');
        console.log('  node index.js "Describe" --latest\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
