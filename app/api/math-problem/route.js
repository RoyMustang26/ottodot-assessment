import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabaseClient";

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  
  try {
    const body = await req.json();
    const { session_id, grade_level } = body;
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Generate one Primary ${grade_level} level math word problem. 
      only use plain text for math expressions like fractions and keep it clear and age-appropriate.
      Provide both the question and the final numeric answer in JSON:
      {
        "problem_text": "...",
        "final_answer": number
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(
        text.replace("```json\n", "").replace("```", "").replace("\n", "")
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
      });
    }

    const { data, error } = await supabase
      .from("math_problem_sessions")
      .insert([
        {
          id: session_id,
          problem_text: parsed.problem_text,
          correct_answer: parsed.final_answer.toString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to generate problem" }),
      { status: 500 }
    );
  }
}
