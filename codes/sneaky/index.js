#!/usr/bin/env node
const { program } = require('commander');
const { getGeminiResponse } = require('./geminiScraper');

program
    .name('gemini-cli')
    .description('CLI tool to get responses from Gemini Pro')
    .version('1.0.0');

program
    .argument('<prompt>', 'Prompt to send to Gemini')
    .option('-v, --visible', 'Show browser window (non-headless mode)', false)
    .option('-t, --timeout <seconds>', 'Timeout in seconds', '120')
    .action(async (prompt, options) => {
        try {
            console.log('Processing your request...\n');

            const result = await getGeminiResponse(prompt, {
                headless: !options.visible,
                timeout: parseInt(options.timeout) * 1000
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
