/**
 * PRESSBOX ADMIN ENGINE (OWNER ONLY)
 * Handles channel management, trash protocols, Echo-01, and Specter Mode Infiltration.
 */

const echo01 = {
    // Simulated system intelligence
    analyze: () => {
        const userCount = state.users.length;
        const channelCount = Object.keys(state.channels).length;
        const msgCount = Object.values(state.channels).reduce((acc, c) => acc + c.messages.length, 0);
        const health = userCount > 0 ? "OPTIMAL" : "STALE";
        return `SYSTEM_REPORT: Health ${health} | Units: ${userCount} | Channels: ${channelCount} | Data_Packets: ${msgCount}`;
    },

    getStatus: () => {
        const uptime = Math.floor(performance.now() / 1000);
        const specterStatus = admin.specterTarget ? `INFILTRATING_${admin.specterTarget}` : 'IDLE';
        return `UPLINK_STABLE: Uptime ${uptime}s | Ghost_Mode: ${admin.isGhost ? 'ON' : 'OFF'} | Specter: ${specterStatus}`;
    },

    processIntent: (input) => {
        const query = input.toLowerCase();
        if (query.includes('status') || query.includes('check')) return echo01.getStatus();
        if (query.includes('scan') || query.includes('analyze')) return echo01.analyze();
        if (query.includes('specter') || query.includes('infiltrate')) return "SPECTER_PROTOCOL: USE /specter [user] TO TETHER VIEW.";
        if (query.includes('hello') || query.includes('identify')) return "ECHO-01 AT YOUR SERVICE, ARCHITECT.";
        return "COMMAND_NOT_RECOGNIZED. SUGGESTED: /ai scan, /ai status";
    }
};

const admin = {
    isGhost: false,
    specterTarget: null,

    init: () => {
        const isAdmin = localStorage.getItem('pb_role') === 'ADMIN';
        admin.initTrash();
        
        if (isAdmin) {
            const controls = document.getElementById('admin-controls');
            const addBtn = document.getElementById('add-channel-btn');
            
            if (controls) controls.classList.remove('hidden');
            if (addBtn) addBtn.classList.remove('hidden');
            
            admin.logIPAccess();
            admin.setupCLI();
        }
    },

    // --- SPECTER MODE: NEURAL TETHERING ---
    toggleSpecter: (targetName) => {
        if (!targetName) {
            if (admin.specterTarget) {
                const prev = admin.specterTarget;
                admin.specterTarget = null;
                admin.updateSpecterUI();
                return `SPECTER_LINK_SEVERED: ${prev} released.`;
            }
            return "ERROR: No target specified.";
        }

        const user = state.users.find(u => u.name.toLowerCase() === targetName.toLowerCase());
        
        if (!user) return `ERROR: Unit ${targetName} not found.`;
        if (user.role === 'ADMIN' && user.name !== localStorage.getItem('pb_user')) {
            return "ERROR: Cannot infiltrate another Architect.";
        }

        // Toggle off if clicking/typing the same person
        if (admin.specterTarget === user.name) {
            admin.specterTarget = null;
            admin.updateSpecterUI();
            return `SPECTER_LINK_SEVERED: Returning to local control.`;
        }

        admin.specterTarget = user.name;
        admin.updateSpecterUI();
        return `SPECTER_LINK_ESTABLISHED: Infiltrating ${user.name}...`;
    },

    updateSpecterUI: () => {
        const hud = document.getElementById('specter-hud');
        const targetDisplay = document.getElementById('target-id');
        
        if (admin.specterTarget) {
            if (hud) hud.classList.remove('hidden');
            if (targetDisplay) targetDisplay.innerText = admin.specterTarget.toUpperCase();
            document.body.classList.add('specter-active');
        } else {
            if (hud) hud.classList.add('hidden');
            document.body.classList.remove('specter-active');
        }
        ui.renderMembers(); // Refresh to show active link in list
    },

    // --- CHANNEL & CONTENT MANAGEMENT ---
    initTrash: () => {
        const trash = document.getElementById('trash-zone');
        if (!trash) return;
        
        trash.ondragover = (e) => { 
            e.preventDefault(); 
            trash.classList.add('active', 'border-red-500', 'text-red-500'); 
        };
        
        trash.ondragleave = () => trash.classList.remove('active', 'border-red-500', 'text-red-500');

        trash.ondrop = (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text');
            if (state.channels[main.activeChannel]) {
                state.channels[main.activeChannel].messages = 
                    state.channels[main.activeChannel].messages.filter(m => m.id != id);
                db.save(); 
                chat.renderFeed(); 
            }
            trash.classList.remove('active', 'border-red-500', 'text-red-500');
        };
    },

    createNewChannel: () => {
        const name = prompt("Channel Name:");
        if (!name) return;
        const type = confirm("OK for Text, Cancel for Voice") ? 'chat' : 'voice';
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        state.channels[id] = { name: name, type: type, messages: [] };
        state.categories[type === 'chat' ? 1 : 2].channels.push(id);
        
        db.save(); 
        ui.renderSidebar();
    },

    // --- ARCHITECT COMMAND DECK LOGIC ---
    toggleGhostMode: () => {
        admin.isGhost = !admin.isGhost;
        const btn = document.getElementById('ghost-btn');
        if (btn) {
            btn.innerHTML = admin.isGhost ? 
                '<i class="fa-solid fa-eye-slash mr-2"></i> Ghost Mode: ON' : 
                '<i class="fa-solid fa-ghost mr-2"></i> Ghost Mode: OFF';
            btn.classList.toggle('border-purple-500', admin.isGhost);
            btn.classList.toggle('text-purple-500', admin.isGhost);
        }
        ui.renderMembers(); 
    },

    promoteUser: (targetName, newRole) => {
        const user = state.users.find(u => u.name.toLowerCase() === targetName.toLowerCase());
        if (user) {
            user.role = newRole.toUpperCase();
            db.save();
            ui.renderMembers();
            return `SUCCESS: ${targetName} is now ${newRole}`;
        }
        return `ERROR: User "${targetName}" not found.`;
    },

    purgeAllSessions: () => {
        if(confirm("RADIATION ALERT: This will clear all local data. Continue?")) {
            localStorage.clear();
            location.reload();
        }
    },

    logIPAccess: () => {
        const list = document.getElementById('ip-sentinel-list');
        if (!list) return;
        const fakeIP = `10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
        const entry = document.createElement('div');
        entry.className = "flex justify-between border-b border-slate-900 pb-1";
        entry.innerHTML = `<span class="text-slate-300">${fakeIP}</span> <span class="text-green-900 text-[8px]">${new Date().toLocaleTimeString()}</span>`;
        list.prepend(entry);
    },

    // --- ENHANCED CLI WITH ECHO-01 & SPECTER ---
    setupCLI: () => {
        const input = document.getElementById('admin-cli');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                const args = val.split(' ');
                const cmd = args[0].toLowerCase();
                let response = "Unknown Command";

                // --- 1. Standard Commands ---
                if (cmd === '/promote') {
                    response = admin.promoteUser(args[1], args[2] || 'Photographer');
                }
                else if (cmd === '/ghost') { 
                    admin.toggleGhostMode(); 
                    response = "GHOST_PROTOCOL_ACTIVE"; 
                }
                else if (cmd === '/clear') { 
                    document.getElementById('chat-feed').innerHTML = ''; 
                    response = "FEED_SANITIZED"; 
                }
                else if (cmd === '/purge') { 
                    admin.purgeAllSessions(); 
                    return; 
                }
                
                // --- 2. Specter Protocol ---
                else if (cmd === '/specter') {
                    response = admin.toggleSpecter(args[1]);
                }
                
                // --- 3. Echo-01 AI Heuristics ---
                else if (cmd === '/ai') {
                    const intent = args.slice(1).join(' ');
                    response = echo01.processIntent(intent);
                }

                // UI Feedback Logic
                input.value = '';
                if (typeof ui.typewriterResponse === 'function') {
                    ui.typewriterResponse(response);
                } else {
                    input.placeholder = response;
                    setTimeout(() => { 
                        input.placeholder = "Enter command (e.g., /ai scan)..."; 
                    }, 3000);
                }
            }
        });
    }
};

admin.init();
