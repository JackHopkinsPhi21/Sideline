/**
 * PRESSBOX UI ENGINE
 * Handles tab switching, hardware detection, live voice visualization, and system logs.
 */

const ui = {
    // --- AI INTERFACE TOOLS ---
    
    typewriterResponse: (text) => {
        const input = document.getElementById('admin-cli');
        if (!input) return;

        input.placeholder = "";
        let i = 0;
        input.disabled = true;

        const interval = setInterval(() => {
            input.placeholder += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                input.disabled = false;
                setTimeout(() => {
                    input.placeholder = "Enter command (e.g., /ai scan)...";
                }, 5000);
            }
        }, 30);
    },

    // --- VIEW MANAGEMENT ---

    switchTab: (tab) => {
        const isAdmin = localStorage.getItem('pb_role') === 'ADMIN';
        if (tab === 'logs' && !isAdmin) tab = 'chat';

        const views = ['chat-view', 'media-view', 'members-view', 'voice-view', 'logs-view'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.add('hidden');
        });

        const targetView = document.getElementById(tab + '-view');
        if (targetView) targetView.classList.remove('hidden');

        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.id === 'tab-' + tab);
            if (b.id === 'tab-logs') b.classList.toggle('hidden', !isAdmin);
        });

        if(tab === 'media') chat.renderGallery();
        if(tab === 'members') ui.renderMembers();
        if(tab === 'logs' && isAdmin) ui.renderLogs(); 
        if(tab === 'voice') ui.refreshHardwareList();
    },

    setTheme: (theme) => {
        const body = document.body;
        body.classList.remove('theme-classic', 'theme-architect');
        body.classList.add(`theme-${theme}`);
        localStorage.setItem('pb_theme', theme);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-theme') === theme;
            btn.classList.toggle('border-green-500', isActive);
            btn.classList.toggle('text-green-500', isActive);
        });
    },

    renderLogs: () => {
        const isAdmin = localStorage.getItem('pb_role') === 'ADMIN';
        const logContainer = document.getElementById('logs-feed');
        if (!logContainer || !isAdmin) return;

        const logs = state.logs || [
            { time: new Date().toLocaleTimeString(), event: "ADMIN_SESSION_ACTIVE", user: localStorage.getItem('pb_user') },
            { time: "12:10", event: "SYSTEM_INITIALIZED", user: "ROOT" }
        ];

        logContainer.innerHTML = logs.map(l => `
            <div class="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl font-mono text-[10px] mb-2">
                <span class="text-slate-500">[${l.time}]</span>
                <span class="text-green-400 font-bold uppercase">${l.event}</span>
                <span class="text-slate-500 ml-auto italic">ID: ${l.user}</span>
            </div>
        `).join('');
    },

    // --- AUDIO VISUALIZATION ---

    startVoiceVisualization: (stream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const indicator = document.getElementById('voice-indicator');
        const volBar = document.getElementById('mic-level-bar');

        const animate = () => {
            if (!document.getElementById('voice-view').classList.contains('hidden')) {
                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
                
                if (indicator && !indicator.classList.contains('muted')) {
                    const scale = 1 + (volume / 128);
                    indicator.style.transform = `scale(${scale})`;
                    indicator.style.boxShadow = `0 0 ${volume * 2}px rgba(34, 197, 94, 0.3)`;
                }

                if (volBar) {
                    const level = Math.min(volume * 2.5, 100);
                    volBar.style.width = `${level}%`;
                    volBar.style.backgroundColor = level > 85 ? '#ef4444' : '#22c55e';
                }

                requestAnimationFrame(animate);
            }
        };
        animate();
    },

    toggleVoice: (type) => {
        const muteBtn = document.getElementById('mute-btn');
        const deafenBtn = document.getElementById('deafen-btn');
        const pulse = document.getElementById('voice-indicator');
        const statusText = document.getElementById('voice-status');

        if (type === 'mute') {
            const isMuted = muteBtn.classList.toggle('voice-btn-active');
            pulse.classList.toggle('muted', isMuted);
            muteBtn.innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
            statusText.innerText = isMuted ? "Input Suppressed" : "Frequency Active";
        }

        if (type === 'deafen') {
            const isDeaf = deafenBtn.classList.toggle('voice-btn-active');
            if (isDeaf) {
                deafenBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                statusText.innerText = "Output Deafened";
                if (!muteBtn.classList.contains('voice-btn-active')) ui.toggleVoice('mute');
            } else {
                deafenBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                statusText.innerText = "Frequency Active";
            }
        }
    },

    refreshHardwareList: async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            ui.startVoiceVisualization(stream); 
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const micSelect = document.getElementById('mic-select');
            const speakerSelect = document.getElementById('speaker-select');
            
            if (!micSelect || !speakerSelect) return;

            micSelect.innerHTML = '';
            speakerSelect.innerHTML = '';

            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `${device.kind === 'audioinput' ? 'Mic' : 'Speaker'} ${device.deviceId.slice(0, 5)}`;
                
                if (device.kind === 'audioinput') micSelect.appendChild(option);
                else if (device.kind === 'audiooutput') speakerSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Hardware access denied:", err);
        }
    },

    // --- NAVIGATION & MEMBERS ---

    toggleCategory: (id) => {
        const cat = state.categories.find(c => c.id === id);
        if (cat) {
            cat.open = !cat.open;
            db.save();
            ui.renderSidebar();
        }
    },

    renderSidebar: () => {
        const nav = document.getElementById('sidebar-nav');
        if (!nav) return;
        nav.innerHTML = '';
        state.categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = `mb-4 ${cat.open ? '' : 'category-collapsed'}`;
            div.innerHTML = `
                <h3 onclick="ui.toggleCategory('${cat.id}')" class="category-header text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center cursor-pointer hover:text-slate-300 transition">
                    <i class="fa-solid fa-chevron-down mr-2 text-[8px] transition-transform"></i> ${cat.name}
                </h3>
                <div class="${cat.open ? '' : 'hidden'} space-y-1">
                    ${cat.channels.map(cId => {
                        const c = state.channels[cId];
                        if (!c) return ''; 
                        const active = main.activeChannel === cId;
                        return `
                            <button onclick="main.switchChannel('${cId}')" class="w-full text-left px-4 py-2 rounded-xl text-[11px] font-black uppercase transition ${active ? 'bg-green-500 text-black' : 'text-slate-400 hover:bg-slate-800'}">
                                <i class="fa-solid ${c.type === 'voice' ? 'fa-volume-high' : 'fa-hashtag'} mr-3"></i>${c.name}
                            </button>`;
                    }).join('')}
                </div>`;
            nav.appendChild(div);
        });
    },

    renderMembers: () => {
        const list = document.getElementById('members-list');
        if (!list) return;
        list.innerHTML = '';
        
        const currentUser = localStorage.getItem('pb_user');
        const canSeeAdminStatus = (localStorage.getItem('pb_role') === 'ADMIN');

        state.users.forEach(u => {
            if (u.name === currentUser && typeof admin !== 'undefined' && admin.isGhost) return;

            const isAdm = u.role === 'ADMIN';
            const isTargeted = typeof admin !== 'undefined' && admin.specterTarget === u.name;

            // Architect tool: Infiltrate button logic
            const specterBtn = (!canSeeAdminStatus || u.name === currentUser || isAdm) ? '' : `
                <button onclick="ui.typewriterResponse(admin.toggleSpecter('${u.name}'))" 
                        class="text-[9px] mt-2 block ${isTargeted ? 'text-purple-400' : 'text-slate-600'} hover:text-purple-500 transition font-black uppercase">
                    <i class="fa-solid ${isTargeted ? 'fa-link-slash' : 'fa-mask'} mr-1"></i> 
                    ${isTargeted ? 'Sever Link' : 'Infiltrate'}
                </button>
            `;

            list.innerHTML += `
                <div class="p-4 bg-slate-900 border ${isTargeted ? 'border-purple-500/50' : 'border-slate-800'} rounded-2xl flex items-center gap-4 transition-colors">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center font-black ${isAdm && canSeeAdminStatus ? 'founder-glow text-green-500' : 'bg-slate-800 text-slate-400'}">
                        ${u.name[0].toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-black uppercase ${isAdm && canSeeAdminStatus ? 'text-green-400' : 'text-white'}">${u.name}</p>
                        <p class="text-[9px] font-bold uppercase text-slate-500">
                            ${isAdm && canSeeAdminStatus ? 'SYSTEM OWNER' : u.role}
                        </p>
                        ${specterBtn}
                    </div>
                    ${isTargeted ? '<div class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>' : ''}
                </div>`;
        });
        
        const countEl = document.getElementById('u-count');
        if (countEl) countEl.innerText = state.users.length;
    },

    updateHardware: (type) => {
        const selectId = type === 'input' ? 'mic-select' : 'speaker-select';
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
            console.log(`[VOICE] Switched ${type} device to: ${selectEl.value}`);
        }
    },

    toggleSettings: () => {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.toggle('hidden');
    }
};
