# Connecting SMS to Slack via Vonage AI Studio
A node application that connects AI Studio SMS agents with Slack to allow for live human customer support agents directly from Slack.

>> You can find full step-by-step instructions on the [Vonage Developer Blog]()

## Prerequisites
1. [Vonage Developer Account](https://developer.vonage.com/sign-up)
2. [Vonage Virtual Number](https://dashboard.nexmo.com/your-numbers)
3. Slack Account and permission to install apps in your workspace
4. [Node](https://nodejs.org/en/download) 


## Instructions
1. Clone this repo
2. In the `.env` file, replace the `SLACK_WEBHOOK_URL` and `AI_STUDIO_KEY` with your Slack App's [Incoming Webhook URL](https://api.slack.com/messaging/webhooks) and your AI Studio [API Key](https://studio.docs.ai.vonage.com/api-integration/authentication).
3. Create a tunnel using a service like localtunnel or ngrok.
4. Configure your Slack App:
  * Enable Interactivity and create a "Start a ticket" shortcut at the endpoint: '{YOUR_TUNNEL_URL}/slack/start'
  * Create a Slash command for '/reply' at the endpoint '{YOUR_TUNNEL_URL}/slack/message'
  * Create a Slash command for '/close_ticket' at the endpoint '{YOUR_TUNNEL_URL}/slack/end'
5. Create an AI Studio SMS Agent that uses the [Live Agent Routing Node](https://studio.docs.ai.vonage.com/sms/nodes/actions/live-agent-routing). Configure the following endpoints:
  * The Start Connection EP should route to '{YOUR_TUNNEL_URL}/start'
  * Inbound transfer EP should route to '{YOUR_TUNNEL_URL}/inbound'
6. Publish your agent with a Vonage Virtual Number
7. Start your application in a second terminal tab by running `node server.js`
8. Try out your new Customer Support system via SMS and Slack!
