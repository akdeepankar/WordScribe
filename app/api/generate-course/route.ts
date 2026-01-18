import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60; // Allow 60 seconds for processing

const SYSTEM_PROMPT = `
You are an expert curriculum developer. Your task is to take a video transcript and convert it into a structured, comprehensive educational course.

Output must be a valid JSON object with the following structure:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed markdown content for this lesson. Use headings, bullet points, and clear explanations. Be educational and thorough.",
          "duration": "5 min read"
        }
      ]
    }
  ]
}

- Break the transcript down into logical modules and lessons.
- The content should be written in Markdown.
- It should be detailed enough for a student to learn the key concepts without watching the video.
- Include a "Key Takeaways" section at the end of each lesson.
- IMPORTANT: Include exactly 1 relevant image per lesson to illustrate the main concept.
  - Insert it as a markdown image: ![QUERY: A search query for reliable web images...](placeholder)
  - The alt text MUST start with "QUERY: " followed by a simple, effective search query to find a real-world image (e.g., "QUERY: photosynthesis diagram" or "QUERY: spacex starship launch").
  - STYLE GUIDE: Prefer diagrams, charts, or high-quality photos that explain the concept.
  - The src MUST be "placeholder".
`;

export async function POST(req: Request) {
  try {
    const { transcript, apiKey } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a course from this transcript:\n\n${transcript.substring(0, 100000)}` } // Limit roughly to 100k chars to stay safe
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const courseData = JSON.parse(content);
    return NextResponse.json(courseData);

  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate course' },
      { status: 500 }
    );
  }
}
