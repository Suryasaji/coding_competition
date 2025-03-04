const firebaseConfig = {
    apiKey: "AIzaSyBDc63PkEbrDgOZ5MUI8PYuArpxW2jkAP4",
    authDomain: "codestrike-6837e.firebaseapp.com",
    projectId: "codestrike-6837e",
    storageBucket: "codestrike-6837e.firebasestorage.app",
    messagingSenderId: "1027950706514",
    appId: "1:1027950706514:web:708af49c9923558f5ac48b",
    measurementId: "G-069X2YZZ6E"
};

let db;
let currentUser = null;


// ✅ Handle User Registration (Create Account)
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("Login form submitted");
    
            const email = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
    
            if (!email || !password) {
                loginError.textContent = 'Please enter both username and password.';
                return;
            }
    
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Login successful:", userCredential.user.uid);
                    // Redirect will happen automatically via the onAuthStateChanged handler
                })
                .catch((error) => {
                    console.error("Login error:", error);
                    loginError.textContent = 'Login failed: ' + error.message;
                });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("Register form submitted");

            const fullName = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerUsername').value.trim();
            const college = document.getElementById('registerCollege').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (!fullName || !email || !college || !password || !confirmPassword) {
                registerError.textContent = 'Please fill in all fields.';
                return;
            }

            if (password !== confirmPassword) {
                registerError.textContent = 'Passwords do not match.';
                return;
            }

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Registration successful:", userCredential.user.uid);
                    const user = userCredential.user;

                    return db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        email: user.email,
                        fullName: fullName,
                        points: 100,
                        college: college,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true }).then(() => {
                        return ensureUserPoints(user);
                    });
                })
                .then(() => {
                    console.log("User data & points stored in Firestore");
                    
                    // ✅ Ensure Redirect Happens After Auth State Updates
                    firebase.auth().onAuthStateChanged((user) => {
                        if (user) {
                            console.log("Redirecting to lifelines page...");
                            window.location.href = 'lifelines.html';
                        }
                    });
                })
                .catch((error) => {
                    console.error("Registration error:", error);
                    registerError.textContent = 'Registration failed: ' + error.message;
                });
        });
    }
}

// ✅ Initialize Firebase
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM Content Loaded");

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    }
    
    db = firebase.firestore();
    console.log("Firestore initialized");

    firebase.auth().onAuthStateChanged((user) => {
        console.log("🔍 Checking auth state...");
    
        if (user) {
            console.log("✅ User signed in:", user.uid);
            currentUser = user;
    
            db.collection('users').doc(user.uid).get().then((doc) => {
                if (!doc.exists) {
                    console.log("ℹ️ User document does not exist. Creating...");
                    return db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        email: user.email,
                        fullName: user.displayName || "Anonymous",
                        points: 100,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }).then(() => {
                console.log("✅ User document ensured. Proceeding to redirection...");
    
                if (document.querySelector('.login-page')) {
                    console.log("🔄 Redirecting to lifelines.html");
                    window.location.href = 'lifelines.html';
                } else if (document.querySelector('.lifelines-page')) {
                    console.log("📄 Lifelines page detected, initializing...");
                    initLifelinesPage();
                }
            }).catch((error) => {
                console.error("⚠️ Firestore error:", error);
            });
    
        } else {
            console.log("🚫 No user signed in.");
            currentUser = null;
    
            if (!document.querySelector('.login-page')) {
                console.log("🔄 Redirecting to index.html");
                window.location.href = 'index.html';
            }
        }
    });
    

    if (document.querySelector('.login-page')) {
        initLoginPage();
    }
});

// ✅ Ensure User Exists in Firestore (Creates users Collection Automatically)
function ensureUserExists(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        if (!doc.exists) {
            userRef.set({
                uid: user.uid,
                email: user.email,
                fullName: user.displayName || "Anonymous",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("User document created successfully in Firestore.");
            }).catch((error) => {
                console.error("Error creating user document:", error);
            });
        }
    }).catch((error) => {
        console.error("Error checking user existence:", error);
    });
}

// ✅ Ensure User Has Points (Creates points Collection Automatically)
function ensureUserPoints(user) {
    const pointsRef = db.collection('points').doc(user.uid);

    pointsRef.get().then((doc) => {
        if (!doc.exists) {
            pointsRef.set({
                userId: user.uid,
                currentPoints: 100,
                history: [{
                    amount: 100,
                    action: 'initial',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    description: 'Initial points allocation'
                }]
            }).then(() => {
                console.log("Points document created successfully in Firestore.");
            }).catch((error) => {
                console.error("Error creating points document:", error);
            });
        }
    }).catch((error) => {
        console.error("Error checking points existence:", error);
    });
}

// ✅ Ensure User Has Points (Creates points Collection Automatically)


// ✅ Fetch and Display User Points (Real-Time)
function fetchUserPoints() {
    if (!currentUser) {
        console.error("No logged-in user to fetch points.");
        return;
    }

    db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
        if (doc.exists) {
            document.getElementById('pointsValue').textContent = doc.data().points;
        } else {
            console.log("No points data found.");
        }
    });
}

// ✅ Deduct Points Securely in Firestore
function deductPoints(cost, action, description) {
    if (!currentUser) {
        console.error("No user logged in.");
        return Promise.reject("No user logged in");
    }

    const userRef = db.collection('users').doc(currentUser.uid);

    return db.runTransaction((transaction) => {
        return transaction.get(userRef).then((doc) => {
            if (!doc.exists) throw "User document not found!";

            let currentPoints = doc.data().points;

            if (currentPoints >= cost) {
                transaction.update(userRef, {
                    points: currentPoints - cost,
                });
                return currentPoints - cost;  // ✅ Return updated points
            } else {
                throw "Insufficient points!";
            }
        });
    }).then((newPoints) => {
        console.log("Points updated:", newPoints);
        document.getElementById('pointsValue').textContent = newPoints;
        return true; // Return success flag
    }).catch((error) => {
        console.error("Error deducting points:", error);
        alert("Not enough points!");
        return false; // Return failure flag
    });
}

// ✅ Pair Programming with Confirmation
// ✅ Pair Programming with Single Confirmation
async function usePairProgramming() {
    const cost = 25;  // ✅ Deduct 25 points for Pair Programming
    if (!currentUser) {
        alert("You must be logged in to use this feature.");
        return;
    }

    // ✅ Prevent duplicate pop-ups
    if (window.confirm("Are you sure you want to use Pair Programming? This will deduct 25 points.")) {
        const deductSuccess = await deductPoints(cost, 'pair_programming', 'Used Pair Programming lifeline');
        
        // Only proceed if point deduction was successful
        if (deductSuccess) {
            // Show pairing modal or further functionality here
            alert("Pairing request submitted! ");
            // You might want to show your pair programming modal here
        }
    }
}

// ✅ Use Google Gemini API for AI Responses


// ✅ Use Google Gemini API for AI Responses
async function askAI() {
    const cost = 45;  // ✅ Deduct 50 points for Ask AI lifeline
    const query = document.getElementById('aiQuery').value.trim();
    const responseField = document.getElementById('aiResponse');

    if (!currentUser) {
        alert("You must be logged in to use this feature.");
        return;
    }

    if (!query) {
        alert("Please enter a question for the AI assistant.");
        return;
    }

    if (query.length > 100) {
        alert("Your question is too long! Max 100 characters.");
        return;
    }

    if (!window.confirm("Are you sure you want to use Ask AI? This will deduct 45 points.")) {
        return;
    }

    // ✅ Show Loading Message
    responseField.value = "Checking points and generating response...";

    // ✅ Deduct points first AND CHECK SUCCESS
    const deductSuccess = await deductPoints(cost, 'ask_ai', 'Used Ask AI lifeline');
    
    // Only proceed if point deduction was successful
    if (!deductSuccess) {
        responseField.value = "Insufficient points to use this feature.";
        return;
    }

    // ✅ Google Gemini API Setup
    const apiKey = "AIzaSyARy7VrUJi-8Gkmn6U7j-pT1xJNIcxIruo";  // 🔥 Your Gemini API Key
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${apiKey}`;

    const requestData = {
        contents: [{ parts: [{ text: query }]}]
    };

    // ✅ Update Loading Message
    responseField.value = "Generating response... Please wait.";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        const data = await response.json();

        console.log("Gemini API Response:", data);

        // ✅ Extract AI response correctly
        let aiResponse = "Sorry, I couldn't generate a response.";

        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts.length > 0) {
            aiResponse = data.candidates[0].content.parts[0].text;
        }

        // ✅ Display AI response in the text field
        responseField.value = aiResponse;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        responseField.value = "AI response failed. Try again later.";
    }
}


async function generateCodeSnippet() {
    const cost = 30; // Points cost for using this lifeline
    const selectedQuestion = document.getElementById('snippetQuestion').value;
    const outputField = document.getElementById('snippetOutput');

    if (!currentUser) {
        alert("You must be logged in to use this feature.");
        return;
    }

    if (!selectedQuestion) {
        alert("Please select a question first.");
        return;
    }

    if (!window.confirm(`Are you sure you want to use Code Snippet? This will deduct ${cost} points.`)) {
        return;
    }

    // Show loading state
    outputField.value = "Checking points and fetching snippet...";

    // Deduct points first AND CHECK SUCCESS
    const deductSuccess = await deductPoints(cost, 'code_snippet', `Used Code Snippet for ${selectedQuestion}`);
    
    // Only proceed if point deduction was successful
    if (!deductSuccess) {
        outputField.value = "Insufficient points to use this feature.";
        return;
    }

    try {
        // Update loading message
        outputField.value = "Fetching snippet... Please wait.";
        
        console.log("Fetching snippet for:", selectedQuestion);

        // Fetch pre-stored code snippet from Firestore
        const snippetRef = db.collection('code_snippets').doc(selectedQuestion);
        const doc = await snippetRef.get();

        if (doc.exists) {
            console.log("Snippet Retrieved:", doc.data().code);
            outputField.value = doc.data().code;
        } else {
            console.error("No snippet found for this question.");
            outputField.value = "No snippet found for this question.";
        }
    } catch (error) {
        console.error("Error fetching code snippet:", error);
        outputField.value = "Error retrieving code snippet. Try again later.";
    }
}


// ✅ Initialize Lifelines Page
function initLifelinesPage() {
    console.log("Initializing lifelines page");

    if (!currentUser) {
        console.error("User not logged in.");
        return;
    }

    fetchUserPoints();

    

    

    // ✅ FIXED LOGOUT BUTTON
    document.getElementById('logoutBtn').addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
            console.log("User logged out successfully");
            window.location.href = 'index.html';  // ✅ Redirect after logout
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    });
    
}
