// Updated TestInterface.js to show all questions in results and use questionStatuses
import { useState, useEffect, useCallback } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { fetchData } from "../api/api";
import { Pie } from "react-chartjs-2"; // Import Pie chart from react-chartjs-2
import "chart.js/auto"; // Ensure Chart.js is loaded

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
    const [chartData, setChartData] = useState(null); // State for pie chart data
    const testType = "topic-wise";

    const styles = {
        testWrapper: {
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            height: "100vh",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            padding: "10px",
            overflowY: "auto",
        },
        whiteBox: {
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            width: "100%",
            height: "calc(100vh - 20px)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
            border: "0.5px solid black",
        },
        headerBar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "15px",
            borderBottom: "0.5px solid black",
        },
        testTitle: {
            fontSize: "22px",
            fontWeight: "700",
            color: "#2c3e50",
        },
        menuBtn: {
            border: "0.5px solid black",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: "#f8f9fa",
            fontWeight: "600",
            color: "#2c3e50",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        },
        questionBox: {
            border: "0.5px solid black",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "left",
            fontSize: "16px",
            backgroundColor: "#f8f9fa",
            boxShadow: "inset 0 2px 5px rgba(0,0,0,0.05)",
            color: "#2c3e50",
            lineHeight: "1.6",
        },
        optionsGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            border: "0.5px solid black",
            padding: "16px",
            borderRadius: "12px",
        },
        optionBtn: {
            border: "0.5px solid black",
            padding: "15px",
            borderRadius: "12px",
            backgroundColor: "white",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            color: "#2c3e50",
        },
        optionBtnSelected: {
            backgroundColor: "#007bff",
            color: "white",
            borderColor: "black",
            transform: "translateY(-2px)",
            boxShadow: "0 5px 15px rgba(0,123,255,0.3)",
        },
        navBtns: {
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "10px",
            border: "0.5px solid black",
            padding: "16px",
            borderRadius: "12px",
        },
        navBtn: {
            border: "0.5px solid black",
            padding: "12px 18px",
            borderRadius: "10px",
            backgroundColor: "#f8f9fa",
            fontWeight: "600",
            cursor: "pointer",
            flex: "1 1 calc(25% - 10px)",
            textAlign: "center",
            transition: "all 0.3s ease",
            color: "#2c3e50",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        },
        testStartButton: {
            alignSelf: "center",
            padding: "14px 30px",
            fontSize: "18px",
            fontWeight: "bold",
            borderRadius: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "0.5px solid black",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(0,123,255,0.3)",
        },
        drawerBackdrop: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(3px)",
            zIndex: "999",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        },
        questionDrawerOverlay: {
            background: "white",
            padding: "25px",
            width: "90%",
            maxWidth: "500px",
            height: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.2)",
            animation: "0.3s ease-out",
            border: "0.5px solid black",
        },
        questionGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "12px",
            marginBottom: "25px",
            border: "0.5px solid black",
            padding: "16px",
            borderRadius: "12px",
        },
        questionTile: {
            width: "55px",
            height: "55px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            color: "white",
            backgroundColor: "#dee2e6",
            border: "0.5px solid black",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        },
        questionTileCorrect: {
            backgroundColor: "#28a745",
            border: "0.5px solid black",
        },
        questionTileIncorrect: {
            backgroundColor: "#dc3545",
            border: "0.5px solid black",
        },
        questionTileMarkedUnanswered: {
            backgroundColor: "#6f42c1",
            border: "0.5px solid black",
        },
        questionTileMarkedAnswered: {
            backgroundColor: "#fd7e14",
            border: "0.5px solid black",
        },
        legend: {
            fontSize: "14px",
            marginTop: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            backgroundColor: "#f8f9fa",
            padding: "15px",
            borderRadius: "10px",
            border: "0.5px solid black",
        },
        legendBox: {
            width: "18px",
            height: "18px",
            borderRadius: "5px",
            display: "inline-block",
            border: "0.5px solid black",
        },
        analysisQuestionBox: {
            marginBottom: "20px",
            padding: "20px",
            border: "0.5px solid black",
            borderRadius: "12px",
            backgroundColor: "#f8f9fa",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        },
        questionHeader: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#2c3e50",
            borderBottom: "0.5px solid black",
            paddingBottom: "8px",
        },
        questionContent: {
            marginBottom: "15px",
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#2c3e50",
            border: "0.5px solid black",
            padding: "10px",
            borderRadius: "8px",
        },
        responseSection: {
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "10px",
            border: "0.5px solid black",
        },
        responseRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            padding: "8px 0",
            borderBottom: "0.5px solid black",
        },
        responseLabel: {
            fontWeight: "600",
            color: "#2c3e50",
        },
        responseValue: {
            fontWeight: "500",
            color: "#2c3e50",
        },
        verdictCorrect: {
            color: "#28a745",
            fontWeight: "bold",
            border: "0.5px solid black",
            padding: "4px 8px",
            borderRadius: "4px",
        },
        verdictIncorrect: {
            color: "#dc3545",
            fontWeight: "bold",
            border: "0.5px solid black",
            padding: "4px 8px",
            borderRadius: "4px",
        },
        optionsGridAnalysis: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "15px",
            border: "0.5px solid black",
            padding: "16px",
            borderRadius: "12px",
        },
        optionRow: {
            padding: "12px",
            borderRadius: "8px",
            border: "0.5px solid black",
            fontSize: "14px",
            backgroundColor: "#f8f9fa",
            textAlign: "center",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        },
        optionCorrect: {
            backgroundColor: "#e6ffe6",
            color: "#28a745",
            fontWeight: "600",
            border: "0.5px solid black",
        },
        optionSelected: {
            backgroundColor: "#ffe6e6",
            color: "#dc3545",
            fontWeight: "600",
            border: "0.5px solid black",
        },
    };

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
        let incorrect = 0;
        let unanswered = 0;

        const statuses = questions.map((q, idx) => {
            const selected = selectedAnswers[idx];
            if (selected === q.CorrectOption) {
                correct++;
                return "correct";
            } else if (markedForReview[idx]) {
                return selected ? "marked-answered" : "marked-unanswered";
            } else if (!selected) {
                unanswered++;
                return "not-answered";
            }
            incorrect++;
            return "incorrect";
        });

        setScore(correct);
        setQuestionStatuses(statuses);
        setTestStarted(false);
        setShowResults(true);

        // Set data for the pie chart
        setChartData({
            labels: ["Correct", "Incorrect", "Unanswered"],
            datasets: [
                {
                    data: [correct, incorrect, unanswered],
                    backgroundColor: ["green", "red", "grey"],
                },
            ],
        });
    }, [questions, selectedAnswers, markedForReview, recordTime]);

    const calculateOverallStats = () => {
        const totalQuestions = questions.length;
        const correctAnswers = questionStatuses.filter(status => status === "correct").length;
        const overallAccuracy = ((correctAnswers / totalQuestions) * 100).toFixed(2);

        const totalTimeSpent = totalTimeTaken;

        // Include 0% confidence for incorrect answers
        const allConfidenceValues = questions.map((_, idx) =>
            questionStatuses[idx] === "correct" ? (confidenceMap[idx] || 0) : 0
        );
        const averageConfidence = (
            allConfidenceValues.reduce((sum, val) => sum + val, 0) / totalQuestions
        ).toFixed(2);

        const averageTimePerQuestion = (
            Object.values(timeSpentPerQuestion).reduce((sum, val) => sum + val, 0) / totalQuestions || 0
        ).toFixed(2);

        return { overallAccuracy, totalTimeSpent, averageConfidence, averageTimePerQuestion };
    };

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
        <div style={styles.testWrapper}>
            <div style={styles.whiteBox}>
                <div style={styles.headerBar}>
                    <div style={styles.testTitle}>Topic Test</div>
                    {testStarted && <div><strong>Time Left:</strong> {formatTime(timeLeft)}</div>}
                    {testStarted && (
                        <div style={styles.menuBtn} onClick={handleMenuClick}>Menu</div>
                    )}
                </div>

                {!testStarted && !showResults ? (
                    <button style={styles.testStartButton} onClick={startTest}>Start Test</button>
                ) : loading ? (
                    <div>Loading...</div>
                ) : showResults ? (
                    <div>
                        <h2>Test Completed</h2>
                        <p><strong>Score:</strong> {score} / {questions.length}</p>
                        <p><strong>Total Time Taken:</strong> {formatTime(totalTimeTaken)}</p>

                        {/* Stats Box */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginBottom: "20px",
                        }}>
                            {Object.entries(calculateOverallStats()).map(([key, value], idx) => {
                                const icons = {
                                    overallAccuracy: "📊", // Emoji for accuracy
                                    totalTimeSpent: "⏱️", // Emoji for time
                                    averageConfidence: "📈", // Emoji for confidence
                                    averageTimePerQuestion: "⏳", // Emoji for average time
                                };
                                return (
                                    <div key={idx} style={{
                                        flex: "1",
                                        padding: "15px",
                                        border: "1px solid #ddd",
                                        borderRadius: "10px",
                                        backgroundColor: "#f9f9f9",
                                        textAlign: "center",
                                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                                    }}>
                                        <div style={{ fontSize: "24px", marginBottom: "10px" }}>{icons[key]}</div>
                                        <h4 style={{ marginBottom: "10px" }}>
                                            {key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                                        </h4>
                                        <p style={{ fontSize: "18px", fontWeight: "bold" }}>
                                            {key === "totalTimeSpent" ? formatTime(value) : value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pie Chart Section */}
                        {chartData && (
                            <div style={{ marginBottom: "20px" }}>
                                <h3>Performance Overview</h3>
                                <Pie data={chartData} />
                            </div>
                        )}

                        {/* Question-wise Stats */}
                        <div>
                            <h3>Question-wise Stats</h3>
                            {questions.map((q, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        ...styles.analysisQuestionBox,
                                        backgroundColor: questionStatuses[idx] === "correct"
                                            ? "#e6ffe6"
                                            : questionStatuses[idx] === "not-answered"
                                            ? "#f2f2f2"
                                            : "#ffe6e6",
                                    }}
                                >
                                    <div style={styles.questionHeader}>
                                        Question {idx + 1} - <em>{questionStatuses[idx]}</em>
                                    </div>
                                    <div style={styles.questionContent}>{renderContent(q.Question)}</div>
                                    <div style={styles.optionsGridAnalysis}>
                                        {["A", "B", "C", "D"].map((opt) => {
                                            const optKey = `Option${opt}`;
                                            const isCorrect = q.CorrectOption === opt;
                                            const isSelected = selectedAnswers[idx] === opt;
                                            return (
                                                <div
                                                    key={opt}
                                                    style={{
                                                        ...styles.optionRow,
                                                        ...(isCorrect ? styles.optionCorrect : {}),
                                                        ...(isSelected && !isCorrect ? styles.optionSelected : {}),
                                                    }}
                                                >
                                                    <strong>{opt}.</strong> {renderContent(q[optKey])}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={styles.responseSection}>
                                        <div style={styles.responseRow}>
                                            <span style={styles.responseLabel}>Time Spent:</span>
                                            <span style={styles.responseValue}>{formatTime(timeSpentPerQuestion[idx] || 0)}</span>
                                        </div>
                                        <div style={styles.responseRow}>
                                            <span style={styles.responseLabel}>User Response:</span>
                                            <span style={styles.responseValue}>{selectedAnswers[idx] || "Not Answered"}</span>
                                        </div>
                                        <div style={styles.responseRow}>
                                            <span style={styles.responseLabel}>Correct Response:</span>
                                            <span style={styles.responseValue}>{q.CorrectOption}</span>
                                        </div>
                                        <div style={styles.responseRow}>
                                            <span style={styles.responseLabel}>Verdict:</span>
                                            <span
                                                style={
                                                    questionStatuses[idx] === "correct"
                                                        ? styles.verdictCorrect
                                                        : styles.verdictIncorrect
                                                }
                                            >
                                                {questionStatuses[idx] === "correct" ? "Correct" : "Incorrect"}
                                            </span>
                                        </div>
                                        <div style={styles.responseRow}>
                                            <span style={styles.responseLabel}>Confidence:</span>
                                            <span style={styles.responseValue}>
                                                {questionStatuses[idx] === "correct" ? confidenceMap[idx] || "0" : "0"}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : current ? (
                    <>
                        <div style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "18px" }}>
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </div>
                        <div style={styles.questionBox}>{renderContent(current.Question)}</div>
                        <div style={styles.optionsGrid}>
                            {["A", "B", "C", "D"].map((opt) => (
                                <button
                                    key={opt}
                                    style={{
                                        ...styles.optionBtn,
                                        ...(selectedAnswers[currentQuestionIndex] === opt ? styles.optionBtnSelected : {}),
                                    }}
                                    onClick={() => handleAnswerSelect(opt)}
                                >
                                    <strong>{opt}.</strong> {renderContent(current[`Option${opt}`])}
                                </button>
                            ))}
                        </div>
                        <div style={styles.navBtns}>
                            <button style={styles.navBtn} onClick={handleBack}>← Back</button>
                            <button style={styles.navBtn} onClick={handleMarkForReview}>Mark for review</button>
                            <button style={styles.navBtn} onClick={() => {
                                const updated = { ...selectedAnswers };
                                delete updated[currentQuestionIndex];
                                setSelectedAnswers(updated);
                                const confUpdated = { ...confidenceMap };
                                delete confUpdated[currentQuestionIndex];
                                setConfidenceMap(confUpdated);
                            }}>Clear</button>
                            <button style={styles.navBtn} onClick={handleNext}>Next →</button>
                            <button style={styles.navBtn} onClick={handleSubmit}>Submit</button>
                        </div>
                    </>
                ) : (
                    <div>No questions</div>
                )}
            </div>

            {showGrid && (
                <div style={styles.drawerBackdrop} onClick={handleBackdropClick}>
                    <div style={styles.questionDrawerOverlay} onClick={e => e.stopPropagation()}>
                        <div style={styles.questionGrid}>
                            {questions.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        ...styles.questionTile,
                                        ...(getTileClass(idx) === "correct" ? styles.questionTileCorrect : {}),
                                        ...(getTileClass(idx) === "incorrect" ? styles.questionTileIncorrect : {}),
                                        ...(getTileClass(idx) === "marked-unanswered" ? styles.questionTileMarkedUnanswered : {}),
                                        ...(getTileClass(idx) === "marked-answered" ? styles.questionTileMarkedAnswered : {}),
                                    }}
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
                        <div style={styles.legend}>
                            <span><span style={{ ...styles.legendBox, backgroundColor: "green" }}></span> Answered</span>
                            <span><span style={{ ...styles.legendBox, backgroundColor: "purple" }}></span> Marked for review but not answered</span>
                            <span><span style={{ ...styles.legendBox, backgroundColor: "orange" }}></span> Marked for review but answered</span>
                            <span><span style={{ ...styles.legendBox, backgroundColor: "#ccc" }}></span> Not attempted</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TestInterface;
