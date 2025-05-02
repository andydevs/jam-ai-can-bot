import "dotenv/config";
import express from "express";
import {
    InteractionResponseType,
    InteractionType,
    verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomEmoji } from "./utils.js";
import OpenAI from "openai";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Get open AI
let client = new OpenAI()

async function doTranslate(message) {
    const response = await client.responses.create({
        model: "gpt-4.1-nano",
        instructions: "Translate any given input into Jamaican Patois",
        input: message
    });
    return response.output_text
}

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
    "/interactions",
    verifyKeyMiddleware(process.env.PUBLIC_KEY),
    async function (req, res) {
        // Interaction id, type and data
        const { id, type, data } = req.body;

        /**
         * Handle verification requests
         */
        if (type === InteractionType.PING) {
            return res.send({ type: InteractionResponseType.PONG });
        }

        /**
         * Handle slash command requests
         * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
         */
        if (type === InteractionType.APPLICATION_COMMAND) {
            const { name } = data;

            // "test" command
            if (name === "test") {
                // Send a message into the channel where command was triggered from
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        // Fetches a random emoji to send from a helper function
                        content: `hello world ${getRandomEmoji()}`,
                    },
                });
            }
            // Translate command
            else if (name == 'translate') {
                const message = data.options[0].value
                let translated = await doTranslate(message)

                // Send translated message
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: translated,
                    },
                });

            }

            console.error(`unknown command: ${name}`);
            return res.status(400).json({ error: "unknown command" });
        }

        console.error("unknown interaction type", type);
        return res.status(400).json({ error: "unknown interaction type" });
    }
);

app.listen(PORT, () => {
    console.log("Listening on port", PORT);
});
