const key = process.env.GOOGLE_AI_API_KEY;
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
    })
}).then(r => r.json()).then(data => console.log(data.candidates[0].content.parts[0].text)).catch(console.error);
