// This runs on Netlify's server, NOT in the browser.
// This is where your Replicate API key stays hidden and safe.

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let prompt, aspect_ratio;
  try {
    const parsed = JSON.parse(event.body);
    prompt = parsed.prompt;
    aspect_ratio = parsed.aspect_ratio;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured. Missing API token.' }) };
  }

  try {
    const startResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: aspect_ratio || '1:1',
          output_format: 'png'
        }
      })
    });

    const prediction = await startResponse.json();

    if (!startResponse.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: prediction.detail || 'Failed to start generation' }) };
    }

    let output = prediction.output;
    let statusUrl = prediction.urls && prediction.urls.get;
    let tries = 0;
    while ((!output || output.length === 0) && statusUrl && tries < 30) {
      await new Promise(r => setTimeout(r, 1000));
      const pollResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
      });
      const pollData = await pollResponse.json();
      if (pollData.status === 'succeeded') {
        output = pollData.output;
        break;
      }
      if (pollData.status === 'failed') {
        return { statusCode: 500, body: JSON.stringify({ error: 'Generation failed' }) };
      }
      tries++;
    }

    if (!output || output.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Generation timed out, try again' }) };
    }

    const imageUrl = Array.isArray(output) ? output[0] : output;

    return { statusCode: 200, body: JSON.stringify({ imageUrl }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error, please try again' }) };
  }
};
