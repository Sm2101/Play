const quiz = [
  {
    question: "What is the chemical symbol for water?",
    options: ["H₂O", "O₂", "CO₂", "H₂"],
    answer: 0
  },
  {
    question: "Who discovered gravity?",
    options: ["Einstein", "Newton", "Galileo", "Rutherford"],
    answer: 1
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    answer: 1
  }
];

let current = 0;
let score = 0;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const quizBox = document.getElementById("quiz-box");
const resultBox = document.getElementById("result-box");
const scoreEl = document.getElementById("score");

function loadQuestion() {
  const q = quiz[current];
  questionEl.textContent = `Q${current + 1}. ${q.question}`;
  optionsEl.innerHTML = "";
  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.classList.add("option");
    div.textContent = opt;
    div.onclick = () => checkAnswer(i);
    optionsEl.appendChild(div);
  });
}

function checkAnswer(selected) {
  const correct = quiz[current].answer;
  if (selected === correct) {
    score++;
  }
  nextBtn.style.display = "block";
}

nextBtn.onclick = () => {
  current++;
  if (current < quiz.length) {
    loadQuestion();
    nextBtn.style.display = "none";
  } else {
    showResult();
  }
};

function showResult() {
  quizBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  scoreEl.textContent = `You scored ${score}/${quiz.length}`;
}

function restartQuiz() {
  current = 0;
  score = 0;
  quizBox.classList.remove("hidden");
  resultBox.classList.add("hidden");
  nextBtn.style.display = "none";
  loadQuestion();
}

loadQuestion();
nextBtn.style.display = "none";
