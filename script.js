/**
 * خبير البرمجة: تم بناء هذا السكربت لتنظيم الحالة بشكل احترافي
 * يحتوي على إدارة الـ LocalStorage، والتعامل مع الصور، ومحاكاة الـ API.
 */

// --- المتغيرات وحالة التطبيق (State) ---
let chats = JSON.parse(localStorage.getItem('chats')) || {};
let currentChatId = null;
let settings = JSON.parse(localStorage.getItem('settings')) || {
    apiKey: '',
    welcomeText: 'كيف يمكنني مساعدتك اليوم؟',
    isDarkMode: true
};
let selectedImageBase64 = null;

// --- عناصر الـ DOM ---
const elements = {
    body: document.body,
    themeToggle: document.getElementById('theme-toggle'),
    sidebar: document.getElementById('sidebar'),
    toggleSidebar: document.getElementById('toggleSidebar') || document.getElementById('toggle-sidebar'), // Fallback
    newChatBtn: document.getElementById('new-chat-btn'),
    chatHistory: document.getElementById('chat-history'),
    welcomeScreen: document.getElementById('welcome-screen'),
    chatContainer: document.getElementById('chat-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    imageUpload: document.getElementById('image-upload'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageBtn: document.getElementById('remove-image'),
    settingsModal: document.getElementById('settings-modal'),
    userAccountBtn: document.getElementById('user-account-btn'),
    closeModal: document.querySelector('.close-modal'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    clearDataBtn: document.getElementById('clear-data-btn'),
    welcomeTextInput: document.getElementById('welcome-text-input'),
    apiKeyInput: document.getElementById('api-key-input'),
    mainWelcomeText: document.getElementById('welcome-text'),
    searchChats: document.getElementById('search-chats')
};

// --- التهيئة الأولية (Initialization) ---
function init() {
    applySettings();
    renderChatList();
    if (Object.keys(chats).length === 0 || !currentChatId) {
        showWelcomeScreen();
    } else {
        loadChat(currentChatId);
    }
}

// --- إدارة الإعدادات والمظهر ---
function applySettings() {
    if (settings.isDarkMode) {
        elements.body.classList.add('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        elements.body.classList.remove('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    elements.mainWelcomeText.innerText = settings.welcomeText;
    elements.welcomeTextInput.value = settings.welcomeText;
    elements.apiKeyInput.value = settings.apiKey;
}

elements.themeToggle.addEventListener('click', () => {
    settings.isDarkMode = !settings.isDarkMode;
    localStorage.setItem('settings', JSON.stringify(settings));
    applySettings();
});

// --- إدارة القائمة الجانبية (Sidebar) ---
elements.toggleSidebar.addEventListener('click', () => {
    elements.sidebar.classList.toggle('closed');
});

// --- إدارة المحادثات (Chat Management) ---
elements.newChatBtn.addEventListener('click', createNewChat);

function createNewChat() {
    currentChatId = Date.now().toString();
    chats[currentChatId] = {
        title: 'دردشة جديدة',
        messages: []
    };
    saveChats();
    renderChatList();
    showWelcomeScreen();
}

function saveChats() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function renderChatList(filter = "") {
    elements.chatHistory.innerHTML = '';
    Object.keys(chats).reverse().forEach(id => {
        const chat = chats[id];
        if (chat.title.includes(filter)) {
            const div = document.createElement('div');
            div.className = `chat-item ${id === currentChatId ? 'active' : ''}`;
            div.innerHTML = `
                <div class="chat-item-title" onclick="loadChat('${id}')">
                    <i class="far fa-comment-alt"></i> ${chat.title}
                </div>
                <div class="chat-options">
                    <i class="fas fa-trash" onclick="deleteChat('${id}', event)" title="حذف"></i>
                </div>
            `;
            elements.chatHistory.appendChild(div);
        }
    });
}

elements.searchChats.addEventListener('input', (e) => {
    renderChatList(e.target.value);
});

// يجب جعل الدالة متاحة عالمياً لتعمل مع onclick في HTML
window.loadChat = function(id) {
    currentChatId = id;
    renderChatList();
    elements.welcomeScreen.style.display = 'none';
    elements.chatContainer.style.display = 'flex';
    elements.chatContainer.innerHTML = '';
    
    chats[id].messages.forEach(msg => {
        appendMessageUI(msg.role, msg.content, msg.image);
    });
    scrollToBottom();
}

window.deleteChat = function(id, event) {
    event.stopPropagation(); // منع فتح المحادثة عند ضغط زر الحذف
    if(confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
        delete chats[id];
        if (currentChatId === id) {
            currentChatId = null;
            showWelcomeScreen();
        }
        saveChats();
        renderChatList();
    }
}

function showWelcomeScreen() {
    elements.welcomeScreen.style.display = 'flex';
    elements.chatContainer.style.display = 'none';
    elements.chatContainer.innerHTML = '';
}

// دالة لتعبئة حقل النص من الاقتراحات
window.fillInput = function(text) {
    elements.messageInput.value = text;
    elements.messageInput.focus();
}

// --- التعامل مع الصور (Image Upload) ---
elements.imageUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedImageBase64 = e.target.result;
            elements.imagePreview.src = selectedImageBase64;
            elements.imagePreviewContainer.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
});

elements.removeImageBtn.addEventListener('click', () => {
    selectedImageBase64 = null;
    elements.imagePreviewContainer.style.display = 'none';
    elements.imageUpload.value = '';
});

// --- منطقة الإدخال والإرسال ---
elements.messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

elements.messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

elements.sendBtn.addEventListener('click', sendMessage);

function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text && !selectedImageBase64) return;

    // التأكد من وجود دردشة نشطة
    if (!currentChatId || !chats[currentChatId]) {
        currentChatId = Date.now().toString();
        chats[currentChatId] = { title: text.substring(0, 20) || "صورة مرسلة", messages: [] };
        renderChatList();
    }

    // إخفاء شاشة الترحيب
    elements.welcomeScreen.style.display = 'none';
    elements.chatContainer.style.display = 'flex';

    // حفظ وعرض رسالة المستخدم
    const userMsg = { role: 'user', content: text, image: selectedImageBase64 };
    chats[currentChatId].messages.push(userMsg);
    appendMessageUI('user', text, selectedImageBase64);
    
    // إعادة ضبط حقل الإدخال
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    elements.removeImageBtn.click(); // مسح الصورة
    
    // تحديث العنوان إذا كانت أول رسالة
    if (chats[currentChatId].messages.length === 1 && text) {
        chats[currentChatId].title = text.substring(0, 20) + "...";
        renderChatList();
    }
    
    saveChats();
    scrollToBottom();

    // محاكاة استدعاء API (وضع الديمو)
    simulateAPIResponse(text, userMsg.image);
}

// --- واجهة الرسائل (UI Rendering) ---
function appendMessageUI(role, text, imageBase64) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    let imageHTML = imageBase64 ? `<img src="${imageBase64}" class="msg-image">` : '';
    let textHTML = text ? `<p>${text.replace(/\n/g, '<br>')}</p>` : '';
    
    // أيقونة المستخدم أو الذكاء الاصطناعي
    let avatarIcon = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    div.innerHTML = `
        <div class="avatar" style="background: var(--bg-input); display:flex; align-items:center; justify-content:center; color: var(--text-main);">
            ${avatarIcon}
        </div>
        <div class="msg-bubble">
            ${imageHTML}
            ${textHTML}
            <div class="msg-actions">
                ${role === 'ai' ? `<i class="far fa-copy" onclick="copyText(this)" title="نسخ"></i>` : ''}
                <span style="font-size: 10px;">${new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    `;
    elements.chatContainer.appendChild(div);
}

function scrollToBottom() {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

window.copyText = function(btn) {
    const text = btn.parentElement.parentElement.querySelector('p').innerText;
    navigator.clipboard.writeText(text);
    btn.className = "fas fa-check";
    setTimeout(() => btn.className = "far fa-copy", 2000);
}

// --- محاكاة الذكاء الاصطناعي (API Simulation) ---
function simulateAPIResponse(userText, hasImage) {
    // إضافة رسالة "جاري التفكير..."
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai thinking-msg';
    thinkingDiv.innerHTML = `
        <div class="avatar" style="background: var(--bg-input); display:flex; align-items:center; justify-content:center;"><i class="fas fa-robot"></i></div>
        <div class="msg-bubble" style="font-style: italic; color: var(--text-muted);">جاري التفكير...</div>
    `;
    elements.chatContainer.appendChild(thinkingDiv);
    scrollToBottom();

    setTimeout(() => {
        // إزالة رسالة جاري التفكير
        elements.chatContainer.removeChild(thinkingDiv);

        let aiResponse = "هذا رد تجريبي لأنك لم تقم بإدخال مفتاح API حقيقي. يمكنك تعديل الكود لربطه مع OpenAI أو أي مزود آخر.";
        
        if (hasImage) {
            aiResponse = "لقد استلمت الصورة بنجاح. يبدو أنك تريد تحليلها. (هذا رد تجريبي)";
        } else if (userText.includes("مرحبا")) {
            aiResponse = "مرحباً بك! كيف يمكنني مساعدتك في مهامك اليوم؟";
        }

        // حفظ وعرض الرد
        const aiMsg = { role: 'ai', content: aiResponse, image: null };
        chats[currentChatId].messages.push(aiMsg);
        saveChats();
        appendMessageUI('ai', aiResponse, null);
        scrollToBottom();

    }, 1500); // محاكاة تأخير الشبكة
}

// --- النوافذ المنبثقة والإعدادات (Modals) ---
elements.userAccountBtn.addEventListener('click', () => {
    elements.settingsModal.style.display = 'flex';
});

elements.closeModal.addEventListener('click', () => {
    elements.settingsModal.style.display = 'none';
});

elements.saveSettingsBtn.addEventListener('click', () => {
    settings.apiKey = elements.apiKeyInput.value;
    settings.welcomeText = elements.welcomeTextInput.value;
    localStorage.setItem('settings', JSON.stringify(settings));
    applySettings();
    elements.settingsModal.style.display = 'none';
    alert("تم حفظ الإعدادات بنجاح!");
});

elements.clearDataBtn.addEventListener('click', () => {
    if(confirm('تحذير: سيتم مسح جميع المحادثات والإعدادات بشكل نهائي. هل أنت متأكد؟')) {
        localStorage.clear();
        location.reload();
    }
});

// إغلاق النافذة عند الضغط خارجها
window.onclick = function(event) {
    if (event.target == elements.settingsModal) {
        elements.settingsModal.style.display = "none";
    }
}

// بدء التشغيل
init();
