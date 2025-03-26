// Updated TestInterface.js to show all questions in results and use questionStatuses
import { useState, useEffect, useCallback } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { fetchData } from "../api/api";
import "./testinterface.css";

function TestInterface() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [confidenceMap, setConfidenceMap] = useState({});
    const [timeSpentPerQuestion, setTimeSpentPerQuestion] = useState({});
    const [lastSwitchTime, setLastSwitchTime] = useState(null);
    const [showGrid, setShowGrid] = useState(false);
    const [markedForReview, setMarkedForReview] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [questionStatuses, setQuestionStatuses] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTimeTaken, setTotalTimeTaken] = useState(0);
    const testType = "topic-wise";

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const payload = { testType, UserID: "1" };
            const data = await fetchData("addquestionpaper", payload);
            if (data && data.addedQuestions) {
                setQuestions(data.addedQuestions);
                const totalTime = testType === "Full-length" ? 180 * 60 : 40 * 60;
                setTimeLeft(totalTime);
                setLastSwitchTime(Date.now());
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const startTest = async () => {
        await fetchQuestions();
        setTestStarted(true);
    };

    const sanitizeHTML = (html) => DOMPurify.sanitize(html, {
        ADD_TAGS: ["math", "mrow", "mi", "mo", "mn"]
    });

    const renderContent = (html) => {
        const clean = sanitizeHTML(html);
        return parse(clean, {
            replace: (node) => {
                if (node.attribs && node.attribs["data-value"]) {
                    return <InlineMath>{node.attribs["data-value"]}</InlineMath>;
                }
            }
        });
    };

    const getTileClass = (index) => {
        const isSelected = selectedAnswers[index];
        const isMarked = markedForReview[index];
        if (isMarked && isSelected) return "marked-answered";
        if (isMarked && !isSelected) return "marked-unanswered";
        if (isSelected) return "correct";
        return "";
    };

    const handleMenuClick = () => setShowGrid(true);
    const handleBackdropClick = () => setShowGrid(false);

    const handleAnswerSelect = (opt) => {
        const current = selectedAnswers[currentQuestionIndex];
        if (!current) {
            setConfidenceMap(prev => ({ ...prev, [currentQuestionIndex]: 100 }));
        } else if (current !== opt) {
            setConfidenceMap(prev => ({
                ...prev,
                [currentQuestionIndex]: Math.floor((prev[currentQuestionIndex] || 100) / 2)
            }));
        }
        setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: opt });
    };

    const handleBack = () => {
        recordTime();
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
    };

    const handleNext = () => {
        recordTime();
        if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
    };

    const handleMarkForReview = () => {
        setMarkedForReview({
            ...markedForReview,
            [currentQuestionIndex]: !markedForReview[currentQuestionIndex]
        });
    };

    const recordTime = useCallback(() => {
        const now = Date.now();
        if (lastSwitchTime !== null) {
            const elapsed = Math.floor((now - lastSwitchTime) / 1000);
            setTimeSpentPerQuestion(prev => ({
                ...prev,
                [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + elapsed
            }));
        }
        setLastSwitchTime(now);
    }, [lastSwitchTime, currentQuestionIndex]);

    const calculateResults = useCallback(() => {
        recordTime();
        let correct = 0;
        const statuses = questions.map((q, idx) => {
            const selected = selectedAnswers[idx];
            if (selected === q.CorrectOption) {
                correct++;
                return "correct";
            } else if (markedForReview[idx]) {
                return selected ? "marked-answered" : "marked-unanswered";
            } else if (!selected) {
                return "not-answered";
            }
            return "incorrect";
        });
        setScore(correct);
        setQuestionStatuses(statuses);
        setTestStarted(false);
        setShowResults(true);
    }, [questions, selectedAnswers, markedForReview, recordTime]);

    const handleSubmit = () => calculateResults();

    const formatTime = (sec) => {
        const min = Math.floor(sec / 60);
        const rem = sec % 60;
        return `${min}:${rem < 10 ? "0" : ""}${rem}`;
    };

    useEffect(() => {
        let timer;
        if (testStarted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                setTotalTimeTaken(prev => prev + 1);
            }, 1000);
        } else if (timeLeft === 0 && testStarted) {
            calculateResults();
        }
        return () => clearInterval(timer);
    }, [testStarted, timeLeft, calculateResults]);

    const current = questions[currentQuestionIndex];

    return (
        <div className="test-wrapper">
            <div className="white-box">
                <div className="header-bar">
                    <div className="test-title">Topic Test</div>
                    {testStarted && <div><strong>Time Left:</strong> {formatTime(timeLeft)}</div>}
                    <div className="menu-btn" onClick={handleMenuClick}>Menu</div>
                </div>

                {!testStarted && !showResults ? (
                    <button className="test-start-button" onClick={startTest}>Start Test</button>
                ) : loading ? (
                    <div>Loading...</div>
                ) : showResults ? (
                    <div>
                        <h2>Test Completed</h2>
                        <p><strong>Score:</strong> {score} / {questions.length}</p>
                        <p><strong>Total Time Taken:</strong> {formatTime(totalTimeTaken)}</p>
                        <div>
                            <h3>Question-wise Stats</h3>
                            {questions.map((q, idx) => (
                                <div key={idx} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ccc", borderRadius: "8px" }}>
                                    <p><strong>Question {idx + 1}</strong> - <em>{questionStatuses[idx]}</em></p>
                                    <p>{renderContent(q.Question)}</p>
                                    <p><strong>Time Spent:</strong> {formatTime(timeSpentPerQuestion[idx] || 0)}</p>
                                    <p><strong>Confidence:</strong> {questionStatuses[idx] === "correct" ? `${confidenceMap[idx] || 100}%` : "0%"}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : current ? (
                    <>
                        <div className="question-box">{renderContent(current.Question)}</div>
                        <div className="options-grid">
                            {["A", "B", "C", "D"].map((opt) => (
                                <button
                                    key={opt}
                                    className={`option-btn ${selectedAnswers[currentQuestionIndex] === opt ? "selected" : ""}`}
                                    onClick={() => handleAnswerSelect(opt)}
                                >
                                    <strong>{opt}.</strong> {renderContent(current[`Option${opt}`])}
                                </button>
                            ))}
                        </div>
                        <div className="nav-btns">
                            <button onClick={handleBack}>← Back</button>
                            <button onClick={handleMarkForReview}>Mark for review</button>
                            <button onClick={() => {
                                const updated = { ...selectedAnswers };
                                delete updated[currentQuestionIndex];
                                setSelectedAnswers(updated);
                                const confUpdated = { ...confidenceMap };
                                delete confUpdated[currentQuestionIndex];
                                setConfidenceMap(confUpdated);
                            }}>Clear</button>
                            <button onClick={handleNext}>Next →</button>
                            <button onClick={handleSubmit}>Submit</button>
                        </div>
                    </>
                ) : (
                    <div>No questions</div>
                )}
            </div>

            {showGrid && (
                <div className="drawer-backdrop" onClick={handleBackdropClick}>
                    <div className="question-drawer-overlay" onClick={e => e.stopPropagation()}>
                        <div className="question-grid">
                            {questions.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`question-tile ${getTileClass(idx)}`}
                                    onClick={() => {
                                        recordTime();
                                        setCurrentQuestionIndex(idx);
                                        setShowGrid(false);
                                    }}
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>
                        <div className="legend">
                            <span><span className="legend-box green"></span> Answered</span>
                            <span><span className="legend-box purple"></span> Marked for review but not answered</span>
                            <span><span className="legend-box orange"></span> Marked for review but answered</span>
                            <span><span className="legend-box gray"></span> Not attempted</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TestInterface;
