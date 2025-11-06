#!/usr/bin/env node
const { program } = require('commander');
const { getGeminiResponse } = require('./geminiScraper');

program
    .name('gemini-cli')
    .description('CLI tool for Gemini Pro with image support')
    .version('1.0.0');

program
    .argument('<prompt>', 'Prompt to send to Gemini')
    .option('-v, --visible', 'Show browser window', false)
    .option('-t, --timeout <seconds>', 'Timeout in seconds', '120')
    .option('-i, --image <path>', 'Path to image file (JPG, PNG, GIF, WEBP)')
    .action(async (prompt, options) => {
        try {
            console.log('Processing your request...\n');

            if (options.image) {
                console.log(`Image: ${options.image}`);
            }

            const result = await getGeminiResponse(prompt, {
                headless: !options.visible,
                timeout: parseInt(options.timeout) * 1000,
                imagePath: options.image
            });

            console.log('\n' + '='.repeat(50));
            console.log('GEMINI RESPONSE:');
            console.log('='.repeat(50) + '\n');
            console.log(JSON.stringify(result, null, 2));

        } catch (err) {
            console.error('\n❌ Error:', err.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
