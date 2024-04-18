// Import required modules
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const AI_STUDIO_KEY = process.env.AI_STUDIO_KEY;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const SESSIONS = {};

// Define the /start endpoint
app.post('/start', (req, res) => {
  const { sessionId, history: { transcription } } = req.body;
  const data = { text: `Session: \`${sessionId}\`\nTranscription:${handleTranscription(transcription)}` };
  axios.post(SLACK_WEBHOOK_URL, data);
  res.send('Start endpoint reached');
});

// Define the /inbound endpoint
app.post('/inbound', (req, res) => {
  const { text, sessionId } = req.body;
  const { thread_ts } = SESSIONS[sessionId];
  const data = { "thread_ts": thread_ts, "text": `Customer response: \`\`\`${text}\`\`\`` };
  axios.post(SLACK_WEBHOOK_URL, data);
  res.send('Inbound endpoint reached');
});

app.post('/slack/start', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const response = JSON.parse(req.body.payload);
  const { ts: thread_ts, text } = response.message;
  const sessionId = extractSessionId(text);
  newSession(sessionId, thread_ts);
  const data = { "thread_ts": thread_ts, "text": `Session seen by <@${response.user.id}>` };
  axios.post(SLACK_WEBHOOK_URL, data);
  console.log(SESSIONS);
  res.send("Begin initiated");
});

// POST /slack/message
app.post('/slack/message', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const { text, user_id } = req.body;
  const { sessionId, message } = parseMessage(text);
  const studio_data = { message_type: 'text', text: message };
  const { thread_ts } = SESSIONS[sessionId];
  const slack_data = { "thread_ts": thread_ts, "text": `Response sent by <@${user_id}> \`\`\`${message}\`\`\`` };
  axios.post(`https://studio-api-eu.ai.vonage.com/live-agent/outbound/${sessionId}`, studio_data, {
    headers: { 'X-Vgai-Key': AI_STUDIO_KEY }
  });
  axios.post(SLACK_WEBHOOK_URL, slack_data);
  res.send("Response sent to user");
});

app.post('/slack/end', bodyParser.urlencoded({ extended: false }), (req, res) => {
  const { sessionId } = parseMessage(req.body.text);
  const data = {};
  axios.post(`https://studio-api-eu.ai.vonage.com/live-agent/disconnect/${sessionId}`, data, {
    headers: { 'X-Vgai-Key': AI_STUDIO_KEY }
  });
  const { thread_ts } = SESSIONS[sessionId];
  const slack_data = { "thread_ts": thread_ts, "text": `This conversation has been marked as resolved.` };
  axios.post(SLACK_WEBHOOK_URL, slack_data);
  res.send("Conversation ended");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const handleTranscription = (transcription = []) => {
  if (!transcription.length) return null;

  let strTrans = '```';

  for (const message of transcription) {
    for (const key in message) {
      strTrans += `\n${key}: ${message[key]}`;
    }
  }

  strTrans += '```';
  return strTrans;
};

const extractSessionId = (input) => {
  const sessionIdPattern = /Session: `([0-9a-f\-]{36})`/i;
  const match = input.match(sessionIdPattern);

  return match && match[1] ? match[1] : null;
};

const parseMessage = (input) => {
  const [sessionId, ...messageParts] = input.split(' ');
  const message = messageParts.join(' ');

  const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (sessionIdPattern.test(sessionId)) {
    return { sessionId, message };
  }

  return { message: input };
};

const newSession = (sessionId, thread_ts) => {
  SESSIONS[sessionId] = { "session_id": sessionId, "thread_ts": thread_ts };
};
