import { NextResponse } from "next/server";

const systemPrompts = `
The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.

Human: Hello, who are you?
AI: I am an Headstarter AI assistant. How can I help you today?
Human: What can you do?
AI: I can help you with a variety of tasks. For example, I can help you write an essay, generate ideas for a new product, or even help you with your homework.
Human: That sounds great! Can you help me write an essay?
AI: Of course! What is the topic of your essay?
Human: The benefits of exercise.
AI: Great! Let me help you get started. Here is an introduction to your essay: Exercise is an important part of a healthy lifestyle. It has many benefits, both physical and mental. Regular exercise can help you lose weight, improve your mood, and boost your energy levels. It can also reduce your risk of chronic diseases like heart disease and diabetes. In this essay, we will explore some of the key benefits of exercise and discuss how you can incorporate it into your daily routine.
Human: That is perfect! Thank you so much!
AI: You're welcome! Is there anything else I can help you with?
Human: No, that is all.
AI: Okay, have a great day!
Human: You too! Goodbye.
AI: Goodbye!
`;

export async function POST(req) {
  try {
    const data = await req.json();

    console.log("Received data:", data);

    // Prepare the API request
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "X-Title": "Headstarter Chatbot", // Optional title for rankings
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2-7b-instruct:free",
          messages: [
            {
              role: "system",
              content: systemPrompts,
            },
            ...data,
          ],
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to fetch from OpenRouter");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              controller.enqueue(value);
            }
          }
        } catch (error) {
          console.error("Error during streaming:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error("Error in API handler:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
