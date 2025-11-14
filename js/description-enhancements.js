// Description Enhancement - Parse and render special features

// Initialize description enhancements
function initDescriptionEnhancements() {
    const descriptionContent = document.getElementById('descriptionContent');
    if (!descriptionContent) return;
    
    const rawDescription = descriptionContent.textContent;
    const enhancedHTML = parseDescription(rawDescription);
    descriptionContent.innerHTML = enhancedHTML;
    
    // Setup timestamp click handlers
    setupTimestampHandlers();
}

// Parse description with enhancements
function parseDescription(text) {
    let html = text;
    
    // 1. Parse timestamps [00:00] -> clickable links
    html = parseTimestamps(html);
    
    // 2. Parse hashtags #tag -> clickable search links
    html = parseHashtags(html);
    
    // 3. Parse CTA buttons [button text="Click" link="url"]
    html = parseCTAButtons(html);
    
    // 4. Parse URLs -> link preview cards
    html = parseURLs(html);
    
    // 5. Parse affiliate links with special styling
    html = parseAffiliateLinks(html);
    
    // 6. Parse discount codes {CODE: SAVE20} -> copy button
    html = parseDiscountCodes(html);
    
    // 7. Parse polls [poll question="?" options="A|B|C"]
    html = parsePolls(html);
    
    // 8. Convert line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// 1. Parse timestamps
function parseTimestamps(text) {
    const timestampRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
    return text.replace(timestampRegex, (match, hours, minutes, seconds) => {
        let totalSeconds;
        if (seconds) {
            totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        } else {
            totalSeconds = parseInt(hours) * 60 + parseInt(minutes);
        }
        return `<span class="timestamp-link" data-time="${totalSeconds}">${match}</span>`;
    });
}

// 2. Parse hashtags
function parseHashtags(text) {
    const hashtagRegex = /#(\w+)/g;
    return text.replace(hashtagRegex, (match, tag) => {
        return `<a href="search.html?q=${encodeURIComponent(match)}" class="hashtag-link">${match}</a>`;
    });
}

// 3. Parse CTA buttons
function parseCTAButtons(text) {
    const buttonRegex = /\[button text="([^"]+)" link="([^"]+)"(?:\s+style="([^"]+)")?\]/g;
    return text.replace(buttonRegex, (match, btnText, link, style) => {
        const styleClass = style || 'primary';
        return `<a href="${link}" class="cta-button cta-${styleClass}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i> ${btnText}
        </a>`;
    });
}

// 4. Parse URLs with preview cards
function parseURLs(text) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, (url) => {
        // Skip if already inside a tag
        if (text.substring(text.lastIndexOf('<', text.indexOf(url)), text.indexOf(url)).includes('href=')) {
            return url;
        }
        
        // Create link with preview card option
        return `<a href="${url}" class="url-link" target="_blank" rel="noopener noreferrer" 
                  onmouseenter="showLinkPreview(this, '${url}')">${url}</a>`;
    });
}

// 5. Parse affiliate links (Amazon, Mercado Livre, etc)
function parseAffiliateLinks(text) {
    const affiliatePatterns = [
        { domain: 'amazon', icon: 'fab fa-amazon', color: '#FF9900' },
        { domain: 'mercadolivre', icon: 'fas fa-shopping-cart', color: '#FFE600' },
        { domain: 'aliexpress', icon: 'fas fa-store', color: '#FF4747' }
    ];
    
    affiliatePatterns.forEach(pattern => {
        const regex = new RegExp(`(https?://[^\\s]*${pattern.domain}[^\\s]*)`, 'gi');
        text = text.replace(regex, (url) => {
            return `<a href="${url}" class="affiliate-link" style="border-left-color: ${pattern.color};" target="_blank" rel="noopener noreferrer">
                <i class="${pattern.icon}"></i> Ver produto
            </a>`;
        });
    });
    
    return text;
}

// 6. Parse discount codes
function parseDiscountCodes(text) {
    const codeRegex = /\{CODE:\s*([A-Z0-9]+)\}/g;
    return text.replace(codeRegex, (match, code) => {
        return `<div class="discount-code-box">
            <span class="discount-label">CÓDIGO DE DESCONTO</span>
            <div class="discount-code" onclick="copyDiscountCode('${code}')">
                <span class="code-text">${code}</span>
                <button class="copy-btn"><i class="fas fa-copy"></i> Copiar</button>
            </div>
        </div>`;
    });
}

// 7. Parse polls
function parsePolls(text) {
    const pollRegex = /\[poll question="([^"]+)" options="([^"]+)"(?:\s+id="([^"]+)")?\]/g;
    return text.replace(pollRegex, (match, question, optionsStr, pollId) => {
        const options = optionsStr.split('|');
        const id = pollId || 'poll_' + Math.random().toString(36).substr(2, 9);
        
        return `<div class="poll-container" data-poll-id="${id}">
            <div class="poll-question">${question}</div>
            <div class="poll-options">
                ${options.map((opt, idx) => `
                    <button class="poll-option" onclick="votePoll('${id}', ${idx})">
                        ${opt.trim()}
                    </button>
                `).join('')}
            </div>
            <div class="poll-results" style="display: none;" id="${id}_results"></div>
        </div>`;
    });
}

// Setup timestamp handlers
function setupTimestampHandlers() {
    document.querySelectorAll('.timestamp-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const time = parseInt(link.dataset.time);
            const videoPlayer = document.getElementById('videoPlayer');
            if (videoPlayer) {
                videoPlayer.currentTime = time;
                videoPlayer.play();
                // Scroll to video
                videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

// Copy discount code
function copyDiscountCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('✅ Código copiado: ' + code);
    }).catch(err => {
        console.error('Error copying code:', err);
    });
}

// Show link preview on hover
let previewTimeout = null;
function showLinkPreview(element, url) {
    clearTimeout(previewTimeout);
    
    previewTimeout = setTimeout(() => {
        fetchLinkPreview(url, element);
    }, 500);
}

async function fetchLinkPreview(url, element) {
    try {
        const response = await fetch(`php/get-link-preview.php?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.success) {
            showPreviewCard(data.preview, element);
        }
    } catch (error) {
        console.error('Error fetching preview:', error);
    }
}

function showPreviewCard(preview, element) {
    const existing = document.querySelector('.link-preview-card');
    if (existing) existing.remove();
    
    const card = document.createElement('div');
    card.className = 'link-preview-card';
    card.innerHTML = `
        ${preview.image ? `<img src="${preview.image}" alt="Preview">` : ''}
        <div class="preview-content">
            <div class="preview-title">${preview.title || 'Link'}</div>
            <div class="preview-description">${preview.description || ''}</div>
            <div class="preview-domain">${preview.domain || ''}</div>
        </div>
    `;
    
    const rect = element.getBoundingClientRect();
    card.style.top = (rect.bottom + 8) + 'px';
    card.style.left = rect.left + 'px';
    
    document.body.appendChild(card);
    
    // Remove on mouse leave
    element.addEventListener('mouseleave', () => {
        setTimeout(() => card.remove(), 200);
    }, { once: true });
}

// Vote in poll
async function votePoll(pollId, optionIndex) {
    try {
        const response = await fetch('php/vote-poll.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                poll_id: pollId,
                option_index: optionIndex,
                video_id: new URLSearchParams(window.location.search).get('v')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayPollResults(pollId, data.results);
        }
    } catch (error) {
        console.error('Error voting:', error);
    }
}

function displayPollResults(pollId, results) {
    const container = document.querySelector(`[data-poll-id="${pollId}"]`);
    if (!container) return;
    
    // Hide options
    container.querySelector('.poll-options').style.display = 'none';
    
    // Show results
    const resultsDiv = container.querySelector('.poll-results');
    const total = results.reduce((sum, r) => sum + r.votes, 0);
    
    resultsDiv.innerHTML = results.map(r => {
        const percentage = total > 0 ? Math.round((r.votes / total) * 100) : 0;
        return `
            <div class="poll-result-bar">
                <span class="poll-result-text">${r.option}</span>
                <span class="poll-result-percentage">${percentage}%</span>
                <div class="poll-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }).join('');
    
    resultsDiv.style.display = 'block';
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize on page load
if (document.getElementById('descriptionContent')) {
    initDescriptionEnhancements();
}
