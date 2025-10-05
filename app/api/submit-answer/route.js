import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabaseClient'

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


export async function POST(req) {
  try {
    const body = await req.json();
    const { session_id, user_answer, problem_text } = body;

    const { data: problem, error: probErr } = await supabase
      .from("math_problem_sessions")
      .select("correct_answer, problem_text")
      .eq("problem_text", problem_text)
      .single();

    if (probErr || !problem) throw probErr;

    const isCorrect = problem.correct_answer === user_answer;

    // Ask Gemini for feedback
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const feedbackPrompt = `
      The student attempted this Primary 5 math problem:

      Problem: ${problem.problem_text}
      Correct Answer: ${problem.correct_answer}
      Student's Answer: ${user_answer}

      Give short, constructive, encouraging feedback.
    `;
    const feedbackResult = await model.generateContent(feedbackPrompt);
    const feedback = feedbackResult.response.text();

    const { data: submission, error: subErr } = await supabase
      .from("math_problem_submissions")
      .insert([{ session_id, user_answer, is_correct: isCorrect, feedback_text: feedback }])
      .select()
      .single();

    if (subErr) throw subErr;

    return new Response(JSON.stringify(submission), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Submission failed" }), { status: 500 });
  }
}
