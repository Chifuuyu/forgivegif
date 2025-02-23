// server.ts
import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";

// Replace these with your Mailjet API credentials or load from environment variables.
const MAILJET_API_KEY = Deno.env.get("MAILJET_API_KEY") || "your_mailjet_api_key";
const MAILJET_API_SECRET = Deno.env.get("MAILJET_API_SECRET") || "your_mailjet_api_secret";
const MAILJET_FROM_EMAIL = "from@example.com"; // Your sender email
const MAILJET_TO_EMAIL = "to@example.com";     // Recipient email

const router = new Router();

router
  // Serve static files from the "public" directory
  .get("/", async (context) => {
    await send(context, context.request.url.pathname, {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  })
  // Endpoint to send email via Mailjet
  .post("/send-email", async (context) => {
    const body = await context.request.body({ type: "json" }).value;
    // Expecting JSON: { category, details, location }
    const category = body.category;
    const details = body.details;
    const location = body.location || "Unknown location";
    // Get the client IP address (this method may vary based on deployment)
    const ip = context.request.ip || "Unknown IP";
    const currentDateTime = new Date().toLocaleString();

    // Construct the email content
    const emailContent = `
      <h3>You forgave Paul on ${currentDateTime} 😉❤️</h3>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Details:</strong> ${details}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
    `;

    // Prepare Mailjet payload as per their API v3.1
    const payload = {
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: "Your App"
          },
          To: [
            {
              Email: MAILJET_TO_EMAIL,
              Name: "Paul"
            }
          ],
          Subject: "Forgiveness Receipt",
          HTMLPart: emailContent,
          CustomID: "AppForgivenessReceipt"
        }
      ]
    };

    // Create Basic Auth string
    const authString = btoa(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`);

    // Send email using Mailjet API
    const mailjetResponse = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await mailjetResponse.json();

    context.response.status = 200;
    context.response.body = { success: true, result };
  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });