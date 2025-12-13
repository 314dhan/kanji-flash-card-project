import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggleButton = document.getElementById('chatbot-toggle-button');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeButton = document.getElementById('chatbot-close-button');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const messagesContainer = document.getElementById('chatbot-messages');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key');

    let genAI = null;
    let chat = null;
    let apiKey = localStorage.getItem('gemini-api-key');
    let hiraganaData, katakanaData, kanjiData;

    // --- UI Interaction ---
    chatbotToggleButton.addEventListener('click', () => {
        chatbotContainer.classList.toggle('open');
        if (chatbotContainer.classList.contains('open')) {
            chatbotToggleButton.style.display = 'none';
        }
    });

    closeButton.addEventListener('click', () => {
        chatbotContainer.classList.remove('open');
        chatbotToggleButton.style.display = 'flex';
    });

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    saveApiKeyButton.addEventListener('click', async () => {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey) {
            apiKey = newApiKey;
            localStorage.setItem('gemini-api-key', apiKey);
            apiKeyInput.value = '';

            const success = await initializeGenerativeAI();

            if (success) {
                apiKeyInput.placeholder = "API Key saved!";
                addMessage('API Key has been saved and AI is ready!', 'bot');
            } else {
                apiKeyInput.placeholder = "API Key failed. Please try again.";
                // Error message is already added inside initializeGenerativeAI
            }
        } else {
            addMessage('Please enter a valid API Key.', 'error');
        }
    });


    // --- Core Functions ---

    /**
     * Initializes the GoogleGenerativeAI client if an API key is available.
     * @returns {Promise<boolean>} True on success, false on failure.
     */
    async function initializeGenerativeAI() {
        if (apiKey) {
            try {
                genAI = new GoogleGenerativeAI(apiKey);
                await preloadDataAndStartChat();
                return true; // Indicate success
            } catch (error) {
                console.error("Error initializing Generative AI:", error);
                addMessage("Failed to initialize the AI model. It's likely your API key is invalid or has restrictions. Please check the key and your network connection.", "error");
                apiKey = null;
                localStorage.removeItem('gemini-api-key');
                genAI = null;
                chat = null;
                return false; // Indicate failure
            }
        } else {
            addMessage("Welcome! Please enter your Google Gemini API key above to start chatting.", 'bot');
            return false; // Indicate failure (no key)
        }
    }

    /**
     * Fetches all necessary JSON data.
     */
    async function loadAllData() {
        try {
            const [hiraganaRes, katakanaRes, kanjiRes] = await Promise.all([
                fetch('assets/data/hiragana.json'),
                fetch('assets/data/katakana.json'),
                fetch('assets/data/kanji-n4.json')
            ]);
            hiraganaData = await hiraganaRes.json();
            katakanaData = await katakanaRes.json();
            kanjiData = await kanjiRes.json();
        } catch (error) {
            console.error("Error loading learning data:", error);
            addMessage("Failed to load learning data. The chatbot may not have the correct context.", "error");
        }
    }
    
    /**
     * Loads data and initializes the chat model.
     */
    async function preloadDataAndStartChat() {
        if (!hiraganaData) { // Only load data once
            await loadAllData();
        }
        
        if (!genAI || !hiraganaData || !katakanaData || !kanjiData) {
            // This case would be handled by the try-catch in initializeGenerativeAI
            throw new Error("AI client or learning data is missing for chat initialization.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-2.5-flash
        const systemPrompt = `You are an expert assistant for learning Japanese. Your name is "Nippon-sensei".
        You MUST strictly use the JSON data provided below to answer any questions. Do not use any external knowledge.
        If the user's question cannot be answered with the provided data, politely state that you do not have that information.
        Be friendly, encouraging, and helpful. Respond in the user's language (the language of the prompt).

        Here is the data you must use:
        1. Hiragana Data: ${JSON.stringify(hiraganaData)}
        2. Katakana Data: ${JSON.stringify(katakanaData)}
        3. Kanji N4 Data: ${JSON.stringify(kanjiData)}
        `;

        chat = model.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });
        
        addMessage("Nippon-sensei is ready! Ask me anything about Hiragana, Katakana, or N4 Kanji.", 'bot');
    }

    /**
     * Handles sending a message from the user to the chatbot.
     */
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        addMessage(messageText, 'user');
        userInput.value = '';

        if (!apiKey || !genAI || !chat) {
            addMessage("Please set a valid API Key and wait for the AI to be ready before you can chat.", 'error');
            return;
        }

        try {
            const result = await chat.sendMessageStream(messageText);
            const botMessageElement = addMessage('', 'bot'); // Create an empty message element for the bot
            let responseText = '';

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                responseText += chunkText;
                // A simple markdown-to-HTML is often needed for model output
                botMessageElement.innerHTML = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

        } catch (error) {
            console.error("Error sending message:", error);
            addMessage("Sorry, I encountered an error. Please try again. If the problem persists, the API key might be invalid or have expired.", 'error');
        }
    }

    /**
     * Adds a message to the chat window.
     * @param {string} text - The message content.
     * @param {string} type - The message type ('user', 'bot', or 'error').
     * @returns {HTMLElement} The created message element.
     */
    function addMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.innerHTML = text; // Use innerHTML to render line breaks from the start
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return messageElement;
    }

    // --- Initial Load ---
    initializeGenerativeAI();
});