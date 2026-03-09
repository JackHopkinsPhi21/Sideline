/**
 * PRESSBOX MAIN ENGINE
 * Manages identity, channel switching, and the BOSS2026 admin gate.
 */

const main = {
    activeChannel: 'general',

    init: () => {
        const {name, role} = db.getUser();
        
        // 1. RECOGNITION: If a name exists in memory, skip the login screen
        if (name) {
            const overlay = document.getElementById('auth-overlay');
            if (overlay) overlay.classList.add('hidden');
            
            main.setupUser(name, role);
            ui.renderSidebar();
            main.switchChannel('general');
        }

        // 2. THE SECRET GATE: Double-click the logo to show/hide the password field
        const logo = document.getElementById('auth-logo');
        if(logo) {
            logo.style.cursor = "pointer"; 
            logo.ondblclick = () => {
                const gate = document.getElementById('admin-gate');
                const adminOption = document.getElementById('admin-option');
                
                if (gate) {
                    const isHidden = gate.classList.toggle('hidden');
                    
                    // Reveal hidden Admin role in dropdown if secret gate is open
                    if (!isHidden && adminOption) {
                        adminOption.classList.remove('hidden');
                        console.log("[SYSTEM] Admin role unlocked in dropdown.");
                    } else if (adminOption) {
                        adminOption.classList.add('hidden');
                    }
                }
            };
        }

        // Bind form submissions
        const regForm = document.getElementById('registrationForm');
        const msgForm = document.getElementById('message-form');
        
        if (regForm) regForm.onsubmit = main.login;
        if (msgForm) msgForm.onsubmit = chat.send;
    },

    login: (e) => {
        e.preventDefault();
        const name = document.getElementById('usernameInput').value;
        const key = document.getElementById('adminCodeInput').value;
        let selectedRole = document.getElementById('roleInput').value;

        // 3. SECURITY & VALIDATION
        // If they chose ADMIN/OWNER but the key is wrong, stop them.
        if (selectedRole === "ADMIN" && key !== ADMIN_KEY) {
            alert("ACCESS DENIED: Valid BOSS2026 Key required for Admin/Owner status.");
            return;
        }

        // If the key is correct, force the role to ADMIN regardless of dropdown
        if (key === ADMIN_KEY) {
            selectedRole = "ADMIN";
            console.log("[SYSTEM] Authentication successful. Role elevated to ADMIN.");
        }

        // PERSISTENCE: Save to browser memory
        localStorage.setItem('pb_user', name);
        localStorage.setItem('pb_role', selectedRole);
        
        location.reload(); 
    },

    // NEW: Terminate session and clear memory for settings
    logout: () => {
        if(confirm("Are you sure you want to terminate this session?")) {
            localStorage.removeItem('pb_user');
            localStorage.removeItem('pb_role');
            location.reload(); // Refresh to show login screen
        }
    },

    setupUser: (name, role) => {
        const nameDisplay = document.getElementById('display-name');
        const av = document.getElementById('user-avatar');
        
        if (nameDisplay) nameDisplay.innerText = name;
        
        if (av) {
            av.innerText = name[0].toUpperCase();

            // Apply specific styles if recognized as ADMIN
            if (role === 'ADMIN') {
                av.classList.add('founder-glow');
                
                // Show hidden Admin-only UI elements
                const addBtn = document.getElementById('add-channel-btn');
                const trash = document.getElementById('trash-zone');
                
                if (addBtn) addBtn.classList.remove('hidden');
                if (trash) trash.classList.remove('hidden');
                
                // Initialize admin features from admin.js
                if (typeof admin !== 'undefined') {
                    admin.initTrash();
                }
            } else {
                av.classList.add('bg-slate-800', 'text-green-500');
            }
        }

        // Add to the public user directory if not already present
        if (!state.users.find(u => u.name === name)) {
            state.users.push({ name, role });
            db.save();
        }
    },

    switchChannel: (id) => {
        if (!state.channels[id]) id = 'general';
        
        main.activeChannel = id;
        const c = state.channels[id];
        
        const title = document.getElementById('channel-title');
        if (title) {
            title.innerText = (c.type === 'voice' ? '🔊 ' : '# ') + c.name;
        }
        
        // Handle Tab Routing
        ui.switchTab(c.type === 'voice' ? 'voice' : 'chat');
        
        if(c.type === 'chat') {
            chat.renderFeed();
        }
        
        ui.renderSidebar();
    }
};

// Fire up the engine
main.init();
