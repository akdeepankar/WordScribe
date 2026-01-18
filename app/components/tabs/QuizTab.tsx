
import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, RefreshCw, Trophy, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizTabProps {
    transcript: string;
    apiKey: string;
}

export default function QuizTab({ transcript, apiKey }: QuizTabProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);

    const handleGenerate = async () => {
        if (!apiKey) {
            alert("No API Key provided");
            return;
        }
        setIsGenerating(true);
        // Reset state
        setQuestions([]);
        setHasGenerated(false);
        setQuizCompleted(false);
        setScore(0);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);

        try {
            const res = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, apiKey })
            });

            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setQuestions(data.questions || []);
            setHasGenerated(true);
        } catch (err) {
            console.error(err);
            alert("Failed to generate quiz");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;
        setIsAnswered(true);
        if (selectedOption === questions[currentQuestionIndex].correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setQuizCompleted(true);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Knowledge Check</h3>
                        <p className="text-xs text-gray-500">Test your understanding</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasGenerated && !quizCompleted && (
                        <span className="text-sm font-mono text-gray-500">
                            Q{currentQuestionIndex + 1}/{questions.length} • Score: {score}
                        </span>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {hasGenerated ? "New Quiz" : "Generate Quiz"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">

                {/* Initial State */}
                {!hasGenerated && !isGenerating && (
                    <div className="text-center text-gray-400">
                        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-600">Ready to test your knowledge?</p>
                        <p className="text-sm">Click "Generate Quiz" to create questions from the transcript.</p>
                    </div>
                )}

                {/* Loading State */}
                {isGenerating && (
                    <div className="text-center text-blue-500 animate-pulse">
                        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" />
                        <p className="font-medium">Crafting questions...</p>
                    </div>
                )}

                {/* Quiz Active */}
                {hasGenerated && !quizCompleted && currentQuestion && (
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                            {currentQuestion.question}
                        </h3>

                        <div className="space-y-3 mb-8">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = currentQuestion.correctIndex === idx;
                                const showResult = isAnswered;

                                let styles = "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-900";
                                if (showResult) {
                                    if (isCorrect) styles = "border-green-500 bg-green-50 text-green-900";
                                    else if (isSelected) styles = "border-red-500 bg-red-50 text-red-900";
                                    else styles = "border-gray-100 opacity-50 text-gray-900";
                                } else if (isSelected) {
                                    styles = "border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        disabled={isAnswered}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                                            styles
                                        )}
                                    >
                                        <span className="font-medium">{option}</span>
                                        {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer / Feedback */}
                        {isAnswered ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold text-gray-900 block mb-1">Explanation:</span>
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                                <button
                                    onClick={handleNextQuestion}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={selectedOption === null}
                                className="w-full py-3 bg-gray-900 hover:bg-black disabled:opacity-30 disabled:hover:bg-gray-900 text-white rounded-xl font-bold transition-colors"
                            >
                                Submit Answer
                            </button>
                        )}
                    </div>
                )}

                {/* Results Screen */}
                {quizCompleted && (
                    <div className="text-center w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                        <p className="text-gray-500 mb-8">You scored {score} out of {questions.length}</p>

                        <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${(score / questions.length) * 100}%` }}
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="text-blue-600 hover:underline font-medium text-sm"
                        >
                            Try Another Quiz
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
