"use client";

import { useState, useEffect } from "react";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);

  useEffect(() => {
    let stored = localStorage.getItem("user_session_id");
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem("user_session_id", stored);
    }
    setSessionId(stored);
  }, []);

  const generateProblem = async () => {
    // TODO: Implement problem generation logic
    // This should call your API route to generate a new problem
    // and save it to the database

    setIsLoading(true);
    setProblem(null);
    setFeedback("");

    try {
      const res = await fetch("/api/math-problem", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, grade_level: difficulty }),
      });
      const data = await res.json();

      if (res.ok) {
        setProblem(data);
      } else {
        console.log(data.error || "Error generating problem");
      }
    } catch (e) {
      console.log("Network error");
    }
    setIsLoading(false);
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement answer submission logic
    // This should call your API route to check the answer,
    // save the submission, and generate feedback

    if (!userAnswer.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/submit-answer", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: Number(userAnswer),
          problem_text: problem.problem_text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback_text);
        setIsCorrect(data.is_correct);
      } else {
        console.log(data.error || "Submission error");
      }
    } catch (e) {
      console.log("Network error");
    }
    localStorage.removeItem("user_session_id");
    setSessionId("");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Math Problem Generator
        </h1>
        <div className="mb-4">
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Primary Grade Level:
          </label>
          <input
            type="number"
            id="difficulty"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            {isLoading ? "Generating..." : "Generate New Problem"}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Problem:
            </h2>
            <p className="text-lg text-gray-800 leading-relaxed mb-6">
              {problem.problem_text}
            </p>

            <form onSubmit={submitAnswer} className="space-y-4">
              <div>
                <label
                  htmlFor="answer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
              >
                Submit Answer
              </button>
            </form>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-lg shadow-lg p-6 ${
              isCorrect
                ? "bg-green-50 border-2 border-green-200"
                : "bg-yellow-50 border-2 border-yellow-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {isCorrect ? "✅ Correct!" : "❌ Not quite right"}
            </h2>
            <p className="text-gray-800 leading-relaxed">{feedback}</p>
          </div>
        )}
      </main>
    </div>
  );
}
