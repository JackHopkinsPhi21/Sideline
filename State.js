const ADMIN_KEY = "BOSS2026";

// Load existing state or create a fresh one
let state = JSON.parse(localStorage.getItem('pb_v4_state')) || {
    categories: [
        { id: "cat-1", name: "Main", channels: ["announcements", "news"], open: true },
        { id: "cat-2", name: "Text Frequencies", channels: ["general"], open: true },
        { id: "cat-3", name: "Voice Channels", channels: ["voice-1"], open: true }
    ],
    channels: {
        "announcements": { name: "announcements", type: "chat", messages: [] },
        "news": { name: "news", type: "chat", messages: [] },
        "general": { name: "general", type: "chat", messages: [] },
        "voice-1": { name: "General Voice", type: "voice", messages: [] }
    },
    users: []
};

const db = {
    save: () => localStorage.setItem('pb_v4_state', JSON.stringify(state)),
    // This is the key: It pulls your saved identity
    getUser: () => ({ 
        name: localStorage.getItem('pb_user'), 
        role: localStorage.getItem('pb_role') 
    })
};
