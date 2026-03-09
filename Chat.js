const chat = {
    send: (e) => {
        e.preventDefault();
        const input = document.getElementById('msg-input');
        if (!input.value.trim()) return;
        const isImg = input.value.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        const {name, role} = db.getUser();
        state.channels[main.activeChannel].messages.push({
            id: Date.now(), user: name, role: role, content: input.value, type: isImg ? 'image' : 'text'
        });
        db.save(); input.value = ''; chat.renderFeed();
    },
    renderFeed: () => {
        const feed = document.getElementById('chat-feed');
        feed.innerHTML = '';
        state.channels[main.activeChannel].messages.forEach(m => {
            const div = document.createElement('div');
            div.className = "p-4 bg-slate-900/50 border border-slate-800 rounded-2xl max-w-[85%] relative group";
            div.draggable = localStorage.getItem('pb_role') === 'ADMIN';
            div.ondragstart = (e) => e.dataTransfer.setData('text', m.id);
            div.innerHTML = `<p class="text-[10px] font-black uppercase mb-1 ${m.role === 'ADMIN' ? 'text-yellow-500' : 'text-green-500'}">${m.user}</p>
                ${m.type === 'image' ? `<img src="${m.content}" class="rounded-lg mt-1 cursor-zoom-in max-h-96" onclick="chat.openTheater('${m.content}')">` : `<p class="text-sm text-slate-300">${m.content}</p>`}`;
            feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
    },
    renderGallery: () => {
        const grid = document.getElementById('media-grid');
        grid.innerHTML = '';
        const imgs = state.channels[main.activeChannel].messages.filter(m => m.type === 'image');
        imgs.forEach(i => { grid.innerHTML += `<img src="${i.content}" onclick="chat.openTheater('${i.content}')" class="aspect-video object-cover rounded-xl border border-slate-800 cursor-pointer">`; });
        document.getElementById('m-count').innerText = imgs.length;
    },
    openTheater: (url) => {
        document.getElementById('theater-content').innerHTML = `<img src="${url}" class="max-w-full max-h-[85vh] rounded-xl">`;
        document.getElementById('theater-mode').classList.remove('hidden');
    }
};
