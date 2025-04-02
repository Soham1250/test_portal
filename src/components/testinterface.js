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
            background: "linear-gradient(to bottom, #d1e9ff, #ffffff)",
            padding: "10px",
            overflowY: "auto",
        },
        whiteBox: {
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            width: "100%",
            height: "calc(100vh - 20px)", // Adjust height to fill the page minus padding
            boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
        },
        headerBar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        },
        testTitle: {
            fontSize: "20px",
            fontWeight: "bold",
        },
        menuBtn: {
            border: "2px solid #000",
            padding: "4px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: "white",
            fontWeight: "600",
        },
        questionBox: {
            border: "2px solid #000",
            borderRadius: "10px",
            padding: "15px",
            textAlign: "center",
            fontSize: "16px",
        },
        optionsGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
        },
        optionBtn: {
            border: "2px solid #000",
            padding: "10px",
            borderRadius: "10px",
            backgroundColor: "white",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            textAlign: "center",
            transition: "background 0.2s",
        },
        optionBtnSelected: {
            backgroundColor: "#007bff",
            color: "white",
            borderColor: "#007bff",
        },
        navBtns: {
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
        },
        navBtn: {
            border: "2px solid #000",
            padding: "10px 15px",
            borderRadius: "10px",
            backgroundColor: "white",
            fontWeight: "600",
            cursor: "pointer",
            flex: "1 1 calc(25% - 10px)",
            textAlign: "center",
        },
        testStartButton: {
            alignSelf: "center",
            padding: "12px 25px",
            fontSize: "18px",
            fontWeight: "bold",
            borderRadius: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
        },
        drawerBackdrop: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: "999",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        },
        questionDrawerOverlay: {
            background: "white",
            padding: "20px",
            width: "90%",
            maxWidth: "500px",
            height: "90vh",
            overflowY: "auto",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
        },
        questionGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "10px",
            marginBottom: "20px",
        },
        questionTile: {
            width: "50px",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background 0.2s",
            color: "white",
            backgroundColor: "#ccc",
            border: "1px solid #999",
        },
        questionTileCorrect: {
            backgroundColor: "green",
        },
        questionTileIncorrect: {
            backgroundColor: "red",
        },
        questionTileMarkedUnanswered: {
            backgroundColor: "purple",
        },
        questionTileMarkedAnswered: {
            backgroundColor: "orange",
        },
        legend: {
            fontSize: "14px",
            marginTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
        },
        legendBox: {
            width: "16px",
            height: "16px",
            borderRadius: "4px",
            display: "inline-block",
        },
        analysisQuestionBox: {
            marginBottom: "20px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        },
        questionHeader: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
        },
        questionContent: {
            marginBottom: "15px",
            fontSize: "16px",
            lineHeight: "1.5",
        },
        responseSection: {
            display: "flex",
            flexDirection: "column",
            gap: "8px",
        },
        responseRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
        },
        responseLabel: {
            fontWeight: "bold",
            color: "#555",
        },
        responseValue: {
            fontWeight: "normal",
            color: "#333",
        },
        verdictCorrect: {
            color: "green",
            fontWeight: "bold",
        },
        verdictIncorrect: {
            color: "red",
            fontWeight: "bold",
        },
        optionsGridAnalysis: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr", // Two columns for options
            gap: "10px",
            marginBottom: "15px",
        },
        optionRow: {
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            fontSize: "14px",
            backgroundColor: "#f9f9f9",
            textAlign: "center",
        },
        optionCorrect: {
            backgroundColor: "#e6ffe6",
            borderColor: "green",
            fontWeight: "bold",
        },
        optionSelected: {
            backgroundColor: "#ffe6e6",
            borderColor: "red",
            fontWeight: "bold",
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
                                            <span style={styles.responseValue}>{confidenceMap[idx] || "0"}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : current ? (
                    <>
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
