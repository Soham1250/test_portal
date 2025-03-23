import { useState } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { fetchData } from "../api/api";
import "./testinterface.css";
import { DiGhostSmall } from "react-icons/di";

function TestInterface() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showGrid, setShowGrid] = useState(false);
    const [markedForReview, setMarkedForReview] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [questionStatuses, setQuestionStatuses] = useState([]);

    const startTest = async () => {
        setTestStarted(true);
        setLoading(true);

        try {
            const payload = {
                testType: "topic-wise",
                UserID: "1",
            };

            const data = await fetchData("addquestionpaper", payload);
            console.log("Full API Response:", data);

            if (data && data.addedQuestions) {
                setQuestions(data.addedQuestions);
            } else {
                console.error("Invalid API response format", data);
            }
        } catch (error) {
            console.error("Failed to load questions:", error);
        }

        setLoading(false);
    };

    const handleMenuClick = () => {
        setShowGrid(!showGrid);
    };

    const handleAnswerSelect = (option) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestionIndex]: option,
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleQuestionClick = (index) => {
        setCurrentQuestionIndex(index);
        setShowGrid(false);
    };

    const handleMarkForReview = () => {
        setMarkedForReview({
            ...markedForReview,
            [currentQuestionIndex]: !markedForReview[currentQuestionIndex],
        });
    };

    const sanitizeHTML = (html) => {
        return DOMPurify.sanitize(html, {
            ADD_TAGS: ["math", "mrow", "mi", "mo", "mn"],
        });
    };

    const renderContent = (html) => {
        const sanitizedHTML = sanitizeHTML(html);

        return parse(sanitizedHTML, {
            replace: (domNode) => {
                if (domNode.attribs && domNode.attribs["data-value"]) {
                    const mathExpression = domNode.attribs["data-value"];
                    return <InlineMath>{mathExpression}</InlineMath>;
                }
            },
        });
    };

    const getQuestionStatus = (index) => {
        if (selectedAnswers[index]) {
            return markedForReview[index] ? "marked-answered" : "answered";
        } else if (markedForReview[index]) {
            return "marked-unanswered";
        } else if (index < currentQuestionIndex) {
            return "visited";
        } else {
            return "unvisited";
        }
    };

    const calculateResults = () => {
        let correctAnswers = 0;
        const statuses = questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[index];
            const isCorrect = selectedAnswer === question.correctAnswer;

            if (selectedAnswer) {
                if (markedForReview[index]) {
                    return isCorrect ? "marked-correct" : "marked-incorrect";
                }
                if (isCorrect) correctAnswers++;
                return isCorrect ? "correct" : "incorrect";
            }
            return "not-answered";
        });

        setScore(correctAnswers);
        setQuestionStatuses(statuses);
        setShowResults(true);
    };

    const current = questions[currentQuestionIndex];

    return (
        <div className="test-page">
            {/* Header */}
            <div className="test-header-bar">
                <h1 className="test-title">Test Portal</h1>
                <DiGhostSmall
                    className="menu-img"
                    onClick={handleMenuClick}
                />
            </div>

            <div className="test-content">
                {/* Main Test Container */}
                <div className="test-container">
                    {!testStarted ? (
                        <button className="test-start-button" onClick={startTest}>
                            Start Test
                        </button>
                    ) : loading ? (
                        <p className="test-loading-text">Loading...</p>
                    ) : showResults ? (
                        <div className="test-results">
                            <h2>Your Score: {score} / {questions.length}</h2>
                            <div className="results-details">
                                {questions.map((question, index) => (
                                    <div key={index} className={`result-question ${questionStatuses[index]}`}>
                                        <h3>Question {index + 1}</h3>
                                        <div>{renderContent(question.Question)}</div>
                                        <p>Status: {questionStatuses[index]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : questions.length > 0 && current ? (
                        <>
                            <h2 className="test-header">Question {currentQuestionIndex + 1}</h2>
                            <div className="test-question-box">{renderContent(current.Question)}</div>

                            <div className="test-options-container">
                                {["A", "B", "C", "D"].map((opt) => {
                                    const optKey = `Option${opt}`;
                                    return (
                                        <div
                                            key={opt}
                                            className={`test-option ${selectedAnswers[currentQuestionIndex] === opt ? "selected" : ""}`}
                                            onClick={() => handleAnswerSelect(opt)}
                                        >
                                            <strong>{opt}.</strong> {renderContent(current[optKey])}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="test-nav-buttons">
                                <button className="test-nav-button" onClick={handleBack} disabled={currentQuestionIndex === 0}>← Back</button>
                                <button className="test-nav-button" onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>Next →</button>
                                <button className="test-nav-button" onClick={handleMarkForReview}>
                                    {markedForReview[currentQuestionIndex] ? "Unmark Review" : "Mark for Review"}
                                </button>
                                <button className="test-nav-button" onClick={calculateResults}>Submit Test</button>
                            </div>
                        </>
                    ) : (
                        <p>No questions available</p>
                    )}
                </div>

                {showGrid && (
                    <div className="question-drawer">
                        <div className="question-grid">
                            {questions.map((_, index) => (
                                <div
                                    key={index}
                                    className={`question-tile ${getQuestionStatus(index)}`}
                                    onClick={() => handleQuestionClick(index)} // Updated onClick event
                                >
                                    {index + 1}
                                </div>
                            ))}
                        </div>

                        <div className="question-status-legend">
                            <div className="legend-item">
                                <span className="legend-color unvisited"></span> Not Attempted
                            </div>
                            <div className="legend-item">
                                <span className="legend-color visited"></span> Visited
                            </div>
                            <div className="legend-item">
                                <span className="legend-color answered"></span> Answered
                            </div>
                            <div className="legend-item">
                                <span className="legend-color marked-unanswered"></span> Marked for Review (Unanswered)
                            </div>
                            <div className="legend-item">
                                <span className="legend-color marked-answered"></span> Marked for Review (Answered)
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TestInterface;
