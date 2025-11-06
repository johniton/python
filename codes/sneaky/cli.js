#!/usr/bin/env node
const { program } = require('commander');
const { getGeminiResponse } = require('./geminiScraper');

program
    .argument('<prompt>', 'Prompt to send to Gemini')
    .action(async (prompt) => {
        try {
            // For CLI, show browser
            const result = await getGeminiResponse(prompt, { headless: false });
            console.log(JSON.stringify(result, null, 2));
        } catch (err) {
            console.error('Error:', err.message);
        }
    });

program.parse(process.argv);

