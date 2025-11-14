// Markdown Editor Management
let markdownEditor = null;

// Initialize Markdown Editor
function initMarkdownEditor() {
    const textarea = document.getElementById('editVideoDescription');
    if (!textarea || markdownEditor) return;
    
    markdownEditor = new EasyMDE({
        element: textarea,
        spellChecker: false,
        placeholder: 'Digite a descrição do seu vídeo aqui...\n\nVocê pode usar Markdown para formatação:\n**negrito** *itálico* [link](url) #hashtag',
        minHeight: '300px',
        maxHeight: '500px',
        toolbar: [
            'bold', 'italic', 'strikethrough', '|',
            'heading-1', 'heading-2', 'heading-3', '|',
            'quote', 'unordered-list', 'ordered-list', '|',
            'link', 'image', 'table', '|',
            'preview', 'side-by-side', 'fullscreen', '|',
            {
                name: 'custom-emoji',
                action: insertEmoji,
                className: 'fa fa-smile',
                title: 'Inserir Emoji'
            },
            {
                name: 'custom-timestamp',
                action: insertTimestamp,
                className: 'fa fa-clock',
                title: 'Inserir Timestamp (00:00)'
            },
            '|',
            'guide'
        ],
        shortcuts: {
            'toggleBold': 'Cmd-B',
            'toggleItalic': 'Cmd-I',
            'drawLink': 'Cmd-K',
            'togglePreview': 'Cmd-P'
        },
        status: ['lines', 'words', 'cursor'],
        autoDownloadFontAwesome: false,
        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true
        }
    });
    
    // Auto-save to localStorage as draft
    markdownEditor.codemirror.on('change', () => {
        const content = markdownEditor.value();
        localStorage.setItem('video_description_draft', content);
        
        // Auto-generate tags
        generateAutoTags(content);
    });
    
    // Load draft if exists
    const draft = localStorage.getItem('video_description_draft');
    if (draft && !markdownEditor.value()) {
        markdownEditor.value(draft);
    }
}

// Insert emoji at cursor
function insertEmoji(editor) {
    const emojis = ['😀', '😂', '❤️', '👍', '🔥', '✨', '🎉', '🎬', '📹', '🎥', '⭐', '👏', '💯', '🚀', '💪'];
    const emoji = prompt('Escolha um emoji:\n\n' + emojis.join(' ') + '\n\nOu digite qualquer emoji:');
    if (emoji) {
        const cm = editor.codemirror;
        cm.replaceSelection(emoji);
    }
}

// Insert timestamp format
function insertTimestamp(editor) {
    const time = prompt('Digite o timestamp (ex: 1:30, 10:25, 1:05:30):');
    if (time) {
        const cm = editor.codemirror;
        cm.replaceSelection(`[${time}]`);
    }
}

// Generate auto tags from title and description
function generateAutoTags(description) {
    const title = document.getElementById('editVideoTitle')?.value || '';
    const text = (title + ' ' + description).toLowerCase();
    
    // Common keywords to extract
    const keywords = [
        'tutorial', 'review', 'gameplay', 'vlog', 'música', 'music',
        'comédia', 'comedy', 'gaming', 'tecnologia', 'tech', 'dica',
        'tip', 'como fazer', 'how to', 'react', 'reação', 'análise',
        'notícia', 'news', 'unboxing', 'teste', 'ao vivo', 'live'
    ];
    
    const foundTags = [];
    keywords.forEach(keyword => {
        if (text.includes(keyword) && !foundTags.includes(keyword)) {
            foundTags.push(keyword);
        }
    });
    
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = text.match(hashtagRegex);
    if (hashtags) {
        hashtags.forEach(tag => {
            const cleanTag = tag.substring(1);
            if (!foundTags.includes(cleanTag)) {
                foundTags.push(cleanTag);
            }
        });
    }
    
    // Display suggested tags
    if (foundTags.length > 0) {
        displaySuggestedTags(foundTags.slice(0, 10));
    }
}

// Display suggested tags
function displaySuggestedTags(tags) {
    const container = document.getElementById('autoTagsContainer');
    const tagsDiv = document.getElementById('suggestedTags');
    
    if (!container || !tagsDiv) return;
    
    tagsDiv.innerHTML = tags.map(tag => 
        `<span class="suggested-tag" onclick="addTagToDescription('${tag}')">#${tag}</span>`
    ).join('');
    
    container.style.display = 'block';
}

// Add tag to description
function addTagToDescription(tag) {
    if (!markdownEditor) return;
    
    const current = markdownEditor.value();
    const hashTag = `#${tag}`;
    
    if (!current.includes(hashTag)) {
        markdownEditor.value(current + '\n' + hashTag);
    }
}

// Template Management
document.getElementById('loadTemplateBtn')?.addEventListener('click', loadTemplates);
document.getElementById('saveTemplateBtn')?.addEventListener('click', saveAsTemplate);

async function loadTemplates() {
    try {
        const response = await fetch('php/get-description-templates.php');
        const data = await response.json();
        
        if (data.success && data.templates.length > 0) {
            showTemplateSelector(data.templates);
        } else {
            alert('Você ainda não tem templates salvos.');
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

function showTemplateSelector(templates) {
    const html = `
        <div class="template-selector-overlay" id="templateOverlay">
            <div class="template-selector-modal">
                <div class="template-header">
                    <h3><i class="fas fa-file-alt"></i> Selecione um Template</h3>
                    <button onclick="closeTemplateSelector()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="template-list">
                    ${templates.map(t => `
                        <div class="template-item" onclick="loadTemplate(${t.id})">
                            <div class="template-name">
                                ${t.is_default ? '<i class="fas fa-star"></i> ' : ''}
                                ${t.name}
                            </div>
                            <div class="template-preview">${t.content.substring(0, 100)}...</div>
                            <div class="template-actions">
                                <button onclick="event.stopPropagation(); deleteTemplate(${t.id})" class="btn-delete-template">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeTemplateSelector() {
    document.getElementById('templateOverlay')?.remove();
}

async function loadTemplate(templateId) {
    try {
        const response = await fetch(`php/get-description-templates.php?id=${templateId}`);
        const data = await response.json();
        
        if (data.success && markdownEditor) {
            markdownEditor.value(data.template.content);
            
            if (data.template.tags) {
                displaySuggestedTags(data.template.tags.split(','));
            }
        }
        
        closeTemplateSelector();
    } catch (error) {
        console.error('Error loading template:', error);
    }
}

async function saveAsTemplate() {
    if (!markdownEditor) return;
    
    const name = prompt('Nome do template:');
    if (!name) return;
    
    const content = markdownEditor.value();
    const isDefault = confirm('Definir como template padrão?');
    
    try {
        const response = await fetch('php/save-description-template.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                content: content,
                is_default: isDefault ? 1 : 0,
                tags: extractTags(content)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Template salvo com sucesso!');
        } else {
            alert('Erro ao salvar template: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Erro ao salvar template.');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Deseja realmente excluir este template?')) return;
    
    try {
        const response = await fetch('php/delete-description-template.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: templateId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTemplateSelector();
            alert('Template excluído!');
        }
    } catch (error) {
        console.error('Error deleting template:', error);
    }
}

function extractTags(content) {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(m => m.substring(1)).join(',') : '';
}

// Initialize editor when modal opens
const editModal = document.getElementById('editVideoModal');
if (editModal) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style') {
                const isVisible = editModal.style.display !== 'none';
                if (isVisible && !markdownEditor) {
                    setTimeout(initMarkdownEditor, 100);
                }
            }
        });
    });
    
    observer.observe(editModal, { attributes: true });
}
