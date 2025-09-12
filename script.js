// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const qrTypeButtons = document.querySelectorAll('.qr-type-btn');
    const qrFormContents = document.querySelectorAll('.qr-form-content');
    const qrSize = document.getElementById('qrSize');
    const qrColorLight = document.getElementById('qrColorLight');
    const qrColorDark = document.getElementById('qrColorDark');
    const qrErrorCorrection = document.getElementById('qrErrorCorrection');
    const sizeValue = document.getElementById('sizeValue');
    const qrCode = document.getElementById('qrcode');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const downloadPNGBtn = document.getElementById('downloadPNG');
    const downloadSVGBtn = document.getElementById('downloadSVG');
    const resetBtn = document.getElementById('resetBtn');
    const extractedTextContainer = document.querySelector('.extracted-text-container');
    const progressBar = document.getElementById('progressBar');
    const status = document.getElementById('status');
    const errorMessage = document.getElementById('errorMessage');
    const toolLinks = document.querySelectorAll('.tool-link');
    const toolCards = document.querySelectorAll('.tool-card');
    const guideSteps = document.querySelectorAll('.guide-step');
    
    // Content input elements for each type
    const urlInput = document.getElementById('urlInput');
    const textInput = document.getElementById('textInput');
    const wifiName = document.getElementById('wifiName');
    const wifiPassword = document.getElementById('wifiPassword');
    const wifiEncryption = document.getElementById('wifiEncryption');
    const wifiHidden = document.getElementById('wifiHidden');
    const socialPlatform = document.getElementById('socialPlatform');
    const socialUsername = document.getElementById('socialUsername');
    const contactName = document.getElementById('contactName');
    const contactPhone = document.getElementById('contactPhone');
    const contactEmail = document.getElementById('contactEmail');
    const contactOrg = document.getElementById('contactOrg');
    
    // State variables
    let qrInstance = null;
    let currentContent = '';
    let currentType = 'url';
    let currentErrorLevel = 'M';
    let currentSize = 200;
    let currentFgColor = '#000000';
    let currentBgColor = '#ffffff';
    
    // Add entrance animations
    animateEntrance();
    
    // Handle QR Type button clicks
    qrTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const qrType = button.getAttribute('data-type');
            
            // Toggle active class on buttons
            qrTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Toggle active class on form contents
            qrFormContents.forEach(form => {
                if (form.getAttribute('data-form') === qrType) {
                    form.classList.add('active');
                    form.style.animation = 'none';
                    setTimeout(() => {
                        form.style.animation = 'fadeIn 0.3s ease-out';
                    }, 10);
                } else {
                    form.classList.remove('active');
                }
            });
            
            // Update current QR type
            currentType = qrType;
            
            // Generate QR code with new type
            generateQRCode();
        });
    });
    
    // Add input event listeners for all form fields
    const contentInputs = document.querySelectorAll('.content-input');
    contentInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            generateQRCode();
        }, 300));
    });
    
    // Add event listeners for non-content inputs
    document.getElementById('wifiPassword').addEventListener('input', debounce(function() {
        generateQRCode();
    }, 300));
    
    document.getElementById('wifiEncryption').addEventListener('change', function() {
        generateQRCode();
    });
    
    document.getElementById('wifiHidden').addEventListener('change', function() {
        generateQRCode();
    });
    
    document.getElementById('socialUsername').addEventListener('input', debounce(function() {
        generateQRCode();
    }, 300));
    
    document.getElementById('contactPhone').addEventListener('input', debounce(function() {
        generateQRCode();
    }, 300));
    
    document.getElementById('contactEmail').addEventListener('input', debounce(function() {
        generateQRCode();
    }, 300));
    
    document.getElementById('contactOrg').addEventListener('input', debounce(function() {
        generateQRCode();
    }, 300));
    
    // Update size value display
    qrSize.addEventListener('input', function() {
        currentSize = this.value;
        sizeValue.textContent = `${currentSize}×${currentSize}px`;
        generateQRCode();
    });
    
    // Initialize size value display
    sizeValue.textContent = `${qrSize.value}×${qrSize.value}px`;
    
    // Add event listeners for style options
    qrColorLight.addEventListener('input', function() {
        currentBgColor = this.value;
        generateQRCode();
    });
    
    qrColorDark.addEventListener('input', function() {
        currentFgColor = this.value;
        generateQRCode();
    });
    
    qrErrorCorrection.addEventListener('change', function() {
        currentErrorLevel = this.value;
        generateQRCode();
    });
    
    // Tool links - make sure we're only alerting for development tools
    toolLinks.forEach(link => {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                alert('This tool is currently under development. Please check back later!');
            });
        }
    });
    
    // Tool cards - add alerts for development tools
    toolCards.forEach(card => {
        if (card.getAttribute('href') === '#') {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                alert('This tool is currently under development. Please check back later!');
            });
        }
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        resetToDefaults();
    });
    
    // Download buttons
    downloadPNGBtn.addEventListener('click', function() {
        if (getQRContent()) {
            downloadQR('png');
        }
    });
    
    downloadSVGBtn.addEventListener('click', function() {
        if (getQRContent()) {
            downloadQR('svg');
        }
    });
    
    // Function to get QR content based on type
    function getQRContent() {
        switch (currentType) {
            case 'url':
                return urlInput.value.trim();
            case 'text':
                return textInput.value.trim();
            case 'wifi':
                if (!wifiName.value.trim()) return '';
                let network = `WIFI:S:${wifiName.value.trim()};`;
                if (wifiEncryption.value !== 'nopass') {
                    network += `T:${wifiEncryption.value};`;
                    if (wifiPassword.value) {
                        network += `P:${wifiPassword.value};`;
                    }
                } else {
                    network += `T:nopass;`;
                }
                if (wifiHidden.checked) {
                    network += `H:true;`;
                }
                network += `;`;
                return network;
            case 'social':
                if (!socialUsername.value.trim()) return '';
                const platform = socialPlatform.value;
                const username = socialUsername.value.trim();
                // If it's a full URL, use as is, otherwise construct it
                if (username.startsWith('http')) {
                    return username;
                }
                
                switch (platform) {
                    case 'instagram':
                        return `https://instagram.com/${username.replace('@', '')}`;
                    case 'facebook':
                        return `https://facebook.com/${username}`;
                    case 'twitter':
                        return `https://twitter.com/${username.replace('@', '')}`;
                    case 'linkedin':
                        return `https://linkedin.com/in/${username}`;
                    case 'tiktok':
                        return `https://tiktok.com/@${username.replace('@', '')}`;
                    default:
                        return username;
                }
            case 'contact':
                if (!contactName.value.trim()) return '';
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                vcard += `FN:${contactName.value.trim()}\n`;
                if (contactPhone.value.trim()) {
                    vcard += `TEL:${contactPhone.value.trim()}\n`;
                }
                if (contactEmail.value.trim()) {
                    vcard += `EMAIL:${contactEmail.value.trim()}\n`;
                }
                if (contactOrg.value.trim()) {
                    vcard += `ORG:${contactOrg.value.trim()}\n`;
                }
                vcard += 'END:VCARD';
                return vcard;
            default:
                return '';
        }
    }
    
    // Function to generate QR code
    function generateQRCode() {
        updateButtonsState();
        
        const content = getQRContent();
        if (!content) {
            qrCode.innerHTML = '';
            qrCode.classList.add('hidden');
            qrPlaceholder.style.display = 'flex';
            progressBar.style.width = '0%';
            status.textContent = '';
            return;
        }
        
        // Show loading indicator and update progress
        loadingIndicator.classList.remove('hidden');
        progressBar.style.width = '0%';
        status.textContent = 'Initializing...';
        status.className = 'status-text processing';
        progressBar.classList.add('active');
        
        // Short delay to ensure the loading indicator is visible
        setTimeout(() => {
            qrPlaceholder.style.display = 'none';
            qrCode.innerHTML = '';
            qrCode.classList.remove('hidden');
            
            try {
                // Update progress
                progressBar.style.width = '50%';
                status.textContent = 'Generating QR code...';
                
                // Generate QR code with QRious library
                new QRious({
                    element: qrCode,
                    value: content,
                    size: currentSize,
                    background: currentBgColor,
                    foreground: currentFgColor,
                    level: currentErrorLevel
                });
                
                // Complete progress
                progressBar.style.width = '100%';
                status.textContent = 'QR code generated!';
                status.className = 'status-text complete';
                progressBar.classList.remove('active');
                
                // Add animation
                qrCode.classList.add('qr-animation');
                setTimeout(() => {
                    qrCode.classList.remove('qr-animation');
                }, 500);
            } catch (error) {
                console.error('Error generating QR code:', error);
                qrPlaceholder.style.display = 'flex';
                qrPlaceholder.innerHTML = '<i class="fas fa-exclamation-circle"></i><p>Error generating QR code. Please try again.</p>';
                qrCode.classList.add('hidden');
                
                // Show error message
                errorMessage.textContent = 'Failed to generate QR code';
                status.textContent = '';
                progressBar.style.width = '0%';
                progressBar.classList.remove('active');
            }
            
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
        }, 300);
    }
    
    // Function to update buttons state
    function updateButtonsState() {
        const hasContent = getQRContent().length > 0;
        downloadPNGBtn.disabled = !hasContent;
        downloadSVGBtn.disabled = !hasContent;
        resetBtn.disabled = !hasContent;
    }
    
    // Function to reset to defaults
    function resetToDefaults() {
        // Reset URL form
        urlInput.value = '';
        
        // Reset Text form
        textInput.value = '';
        
        // Reset WiFi form
        wifiName.value = '';
        wifiPassword.value = '';
        wifiEncryption.value = 'WPA';
        wifiHidden.checked = false;
        
        // Reset Social form
        socialPlatform.value = 'instagram';
        socialUsername.value = '';
        
        // Reset Contact form
        contactName.value = '';
        contactPhone.value = '';
        contactEmail.value = '';
        contactOrg.value = '';
        
        // Reset style options
        qrSize.value = 200;
        qrColorLight.value = '#ffffff';
        qrColorDark.value = '#000000';
        qrErrorCorrection.value = 'M';
        
        // Reset current values
        currentSize = 200;
        currentBgColor = '#ffffff';
        currentFgColor = '#000000';
        currentErrorLevel = 'M';
        
        sizeValue.textContent = `${currentSize}×${currentSize}px`;
        
        qrCode.innerHTML = '';
        qrCode.classList.add('hidden');
        qrPlaceholder.style.display = 'flex';
        qrPlaceholder.innerHTML = '<i class="fas fa-qrcode"></i><p>QR code will appear here</p>';
        
        // Reset progress and status
        progressBar.style.width = '0%';
        status.textContent = '';
        status.className = 'status-text';
        errorMessage.textContent = '';
        
        updateButtonsState();
        
        // Add animation to the form
        const optionsSection = document.querySelector('.options-section');
        optionsSection.classList.add('reset-animation');
        setTimeout(() => {
            optionsSection.classList.remove('reset-animation');
        }, 500);
    }
    
    // Function to download QR code
    function downloadQR(type) {
        const content = getQRContent();
        if (!content) return;
        
        // Update status
        status.textContent = 'Preparing download...';
        status.className = 'status-text processing';
        
        // Create a temporary canvas to generate a high-quality image
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        const size = currentSize * 2; // Double size for better quality
        tempCanvas.width = size;
        tempCanvas.height = size;
        
        // Generate QR code on the canvas
        new QRious({
            element: tempCanvas,
            value: content,
            size: size,
            background: currentBgColor,
            foreground: currentFgColor,
            level: currentErrorLevel
        });
        
        // Get file name based on QR type
        let fileName = getQRFileName();
        
        if (type === 'png') {
            // For PNG download
            const link = document.createElement('a');
            link.download = fileName + '.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
            
            // Update status
            status.textContent = 'QR code downloaded as PNG!';
            status.className = 'status-text complete';
        } else if (type === 'svg') {
            // For SVG download, we need to create an SVG from the QR code data
            // This is a simplified approach; a real implementation would need to properly convert pixel data to SVG
            const qr = new QRious({
                value: content,
                size: size,
                background: currentBgColor,
                foreground: currentFgColor,
                level: currentErrorLevel
            });
            
            // Create SVG content
            const svgContent = generateSVGFromQR(qr, size);
            
            // Create downloadable link
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            link.download = fileName + '.svg';
            link.href = URL.createObjectURL(blob);
            link.click();
            
            // Update status
            status.textContent = 'QR code downloaded as SVG!';
            status.className = 'status-text complete';
        }
        
        // Reset status after 2 seconds
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status-text';
        }, 2000);
    }
    
    // Function to generate filename based on QR type
    function getQRFileName() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        
        switch (currentType) {
            case 'url':
                try {
                    const url = new URL(urlInput.value.trim());
                    return `url-${url.hostname}-${timestamp}`;
                } catch (e) {
                    return `url-qrcode-${timestamp}`;
                }
            case 'text':
                const shortText = textInput.value.trim().substring(0, 20).replace(/\W+/g, '-');
                return `text-${shortText}-${timestamp}`;
            case 'wifi':
                return `wifi-${wifiName.value.trim().replace(/\W+/g, '-')}-${timestamp}`;
            case 'social':
                return `social-${socialPlatform.value}-${timestamp}`;
            case 'contact':
                return `contact-${contactName.value.trim().replace(/\W+/g, '-')}-${timestamp}`;
            default:
                return `qrcode-${timestamp}`;
        }
    }
    
    // Function to generate SVG from QR code
    function generateSVGFromQR(qr, size) {
        const moduleSize = size / qr.modules;
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${currentBgColor}" />`;
        
        // Get image data from canvas
        const canvas = qr.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // For each pixel, check if it's dark and add a rect if it is
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                // Check if this pixel is dark (not white)
                if (data[idx] === 0 && data[idx + 1] === 0 && data[idx + 2] === 0) {
                    svgContent += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${currentFgColor}" />`;
                }
            }
        }
        
        svgContent += '</svg>';
        return svgContent;
    }
    
    // Debounce function to limit how often a function is called
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Function to animate elements on entrance
    function animateEntrance() {
        // Stagger the animations for the guide steps
        guideSteps.forEach((step, index) => {
            step.style.animationDelay = `${0.2 + (index * 0.1)}s`;
            step.style.animation = 'slideIn 0.5s ease-out forwards';
            
            // Also add reveal effect on scroll
            setTimeout(() => {
                step.classList.add('revealed');
            }, 500 + (index * 100));
        });
        
        // Stagger the QR type button animations
        qrTypeButtons.forEach((btn, index) => {
            btn.style.animationDelay = `${0.1 + (index * 0.05)}s`;
            btn.style.animation = 'slideIn 0.4s ease-out forwards';
            btn.style.opacity = '0';
        });
        
        // Add animations for tool links
        toolLinks.forEach((link, index) => {
            link.style.animationDelay = `${0.3 + (index * 0.1)}s`;
            link.style.animation = 'slideIn 0.4s ease-out forwards';
            
            // Also add reveal effect on scroll
            setTimeout(() => {
                link.classList.add('revealed');
            }, 700 + (index * 100));
        });
        
        // Stagger the tool card animations
        toolCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            card.style.transitionDelay = `${0.2 + (index * 0.1)}s`;
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        });
        
        // Add scroll reveal for elements as they come into view
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.guide-step, .tool-link').forEach(el => {
            observer.observe(el);
        });
        
        // Observe the popular tools section for fade-in
        const toolsSection = document.querySelector('.popular-tools-section');
        if (toolsSection) {
            const sectionObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    const title = toolsSection.querySelector('.section-title');
                    const description = toolsSection.querySelector('.section-description');
                    
                    if (title) {
                        title.style.animation = 'fadeIn 0.8s ease-out forwards';
                    }
                    
                    if (description) {
                        description.style.opacity = '0';
                        description.style.animation = 'fadeIn 0.8s ease-out 0.2s forwards';
                    }
                    
                    sectionObserver.unobserve(toolsSection);
                }
            }, {
                threshold: 0.1
            });
            
            sectionObserver.observe(toolsSection);
        }
    }
    
    // Add CSS animation class
    const style = document.createElement('style');
    style.textContent = `
        @keyframes qr-fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes reset-bounce {
            0% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
            60% { transform: translateY(5px); }
            100% { transform: translateY(0); }
        }
        
        .qr-animation {
            animation: qr-fade-in 0.5s ease-out;
        }
        
        .reset-animation {
            animation: reset-bounce 0.5s ease-out;
        }
        
        .guide-step, .tool-link {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .guide-step.revealed, .tool-link.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        
        .tool-card {
            position: relative;
            overflow: hidden;
        }
        
        .tool-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: 0.5s;
            z-index: 1;
        }
        
        .tool-card:hover::after {
            left: 100%;
        }
        
        .popular-tools-section .section-title,
        .popular-tools-section .section-description {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize with empty state
    updateButtonsState();
    
    // Add event listeners for animation effects
    document.addEventListener('DOMContentLoaded', function() {
        // Apply animations to tool cards
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.add('floating');
                }
            });
            
            card.addEventListener('mouseleave', function() {
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('floating');
                }
            });
        });
        
        // Apply animations to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                this.classList.add('pulse-animation');
                setTimeout(() => {
                    this.classList.remove('pulse-animation');
                }, 1000);
            });
        });
        
        // Apply animations to guide steps
        const guideSteps = document.querySelectorAll('.guide-step');
        guideSteps.forEach(step => {
            step.addEventListener('mouseenter', function() {
                const stepNumber = this.querySelector('.step-number');
                if (stepNumber) {
                    stepNumber.classList.add('floating');
                }
            });
            
            step.addEventListener('mouseleave', function() {
                const stepNumber = this.querySelector('.step-number');
                if (stepNumber) {
                    stepNumber.classList.remove('floating');
                }
            });
        });
        
        // Add animation when QR code is generated
        const generateButton = document.getElementById('generate');
        if (generateButton) {
            generateButton.addEventListener('click', function() {
                setTimeout(() => {
                    const qrCodeElement = document.getElementById('qrcode');
                    if (qrCodeElement) {
                        qrCodeElement.classList.add('generated');
                        setTimeout(() => {
                            qrCodeElement.classList.remove('generated');
                        }, 500);
                    }
                }, 100);
            });
        }
        
        // Add highlight animation to input fields on focus
        const inputFields = document.querySelectorAll('input[type="text"], input[type="url"], textarea');
        inputFields.forEach(field => {
            field.addEventListener('focus', function() {
                this.closest('.form-group')?.classList.add('highlight-animation');
            });
            
            field.addEventListener('blur', function() {
                this.closest('.form-group')?.classList.remove('highlight-animation');
            });
        });
        
        // Add rotation animation to reset button
        const resetButton = document.querySelector('.btn-reset');
        if (resetButton) {
            resetButton.addEventListener('click', function() {
                this.classList.add('rotate-animation');
                setTimeout(() => {
                    this.classList.remove('rotate-animation');
                }, 1000);
            });
        }
        
        // Add animations for color presets
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            preset.addEventListener('click', function() {
                this.classList.add('success-shake');
                setTimeout(() => {
                    this.classList.remove('success-shake');
                }, 500);
            });
        });
        
        // Implement scroll reveal animation for guide steps and tool cards
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const elementObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Apply scroll reveal to guide steps
        document.querySelectorAll('.guide-step').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.5s ease, transform 0.5s ease ${index * 0.1}s`;
            elementObserver.observe(el);
        });
        
        // Apply scroll reveal to tool cards
        document.querySelectorAll('.tool-card').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.5s ease, transform 0.5s ease ${index * 0.1}s`;
            elementObserver.observe(el);
        });
        
        // Apply scroll reveal to popular tools
        document.querySelectorAll('.popular-tools .card').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.5s ease, transform 0.5s ease ${index * 0.1}s`;
            elementObserver.observe(el);
        });
        
        // Add success animation when download button is clicked
        const downloadButtons = document.querySelectorAll('.download-btn, .btn-download');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function() {
                this.classList.add('success-flash');
                setTimeout(() => {
                    this.classList.remove('success-flash');
                }, 1000);
            });
        });
    });
}); 