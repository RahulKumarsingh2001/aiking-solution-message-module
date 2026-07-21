```
import twilio from "twilio";

const client = twilio("ACCOUNT_SID", "AUTH_TOKEN");

## 📩 Send Normal SMS
async function sendSMS() {
  await client.messages.create({
    body: "Hello Rahul, this is SMS",
    from: "+1234567890", // Twilio phone number
    to: "+91XXXXXXXXXX",
  });
}

## 💬 Send WhatsApp Message
async function sendWhatsApp() {
  await client.messages.create({
    body: "Hello Rahul 👋 (WhatsApp)",
    from: "whatsapp:+14155238886", // Twilio WhatsApp sandbox
    to: "whatsapp:+91XXXXXXXXXX",
  });
}

sendSMS();
sendWhatsApp();
```