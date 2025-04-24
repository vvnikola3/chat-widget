class MyChatWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isMinimized = false;
        this.isFullScreen = false;

        const host = window.location.hostname;
        let baseUrl;

        console.log('host', host)
        //local
        if (host.includes('localhost')) {
            baseUrl = 'http://localhost:8080';
        }
        //set test url
        else if (host.includes('test')) {
            baseUrl = '';
        }
        //set prod url
        else {
            baseUrl = '';
        }

        //testing purposes

        this.shadowRoot.innerHTML = `
              <style>
                @import '${baseUrl}/chat-styles.css';
              </style>
      <div class="chat-container">
        <div class="chat-header">
          <div class="header-title">Virtuelni pomocnik</div>
          <div class="header-controls">
            <button class="btn-control btn-fullscreen" title="Full Screen">⤢</button>
            <button class="btn-control btn-minimize" title="Minimize">−</button>
            <button class="btn-control btn-close" title="Close">×</button>
          </div>
        </div>
        <div class="chat-body">
          <div class="chat-messages">
            <div class="bot-message-with-buttons">
              <div class="predefined-questions">
                <button class="question-button">Pronađi adresu</button>
                <button class="question-button">Pronađi parcelu</button>
                <button class="question-button">Prikaz na mapi</button>
                <button class="question-button">Preuzmi pdf</button>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" placeholder="Type a message..." />
            <button>Pošalji</button>
          </div>
        </div>
      </div>
    `;
    }

    connectedCallback() {
        const sendButton = this.shadowRoot.querySelector('.chat-input button');
        const input = this.shadowRoot.querySelector('input');
        const messages = this.shadowRoot.querySelector('.chat-messages');
        const closeButton = this.shadowRoot.querySelector('.btn-close');
        const minimizeButton = this.shadowRoot.querySelector('.btn-minimize');
        const fullScreenButton = this.shadowRoot.querySelector('.btn-fullscreen');
        const chatContainer = this.shadowRoot.querySelector('.chat-container');
        const questionButtons = this.shadowRoot.querySelectorAll('.question-button');

        const header = this.shadowRoot.querySelector('.chat-header');

        header.addEventListener('click', (e) => {
            // Don't toggle minimize if we click on a control button
            if (e.target.closest('.header-controls')) {
                return;
            }

            if (this.isFullScreen) {
                return;
            }

            this.isMinimized = !this.isMinimized;

            if (this.isMinimized) {
                chatContainer.classList.add('minimized');
                fullScreenButton.style.display = 'none';
                minimizeButton.style.display = 'none';
            } else {
                chatContainer.classList.remove('minimized');
                minimizeButton.textContent = '−';
                minimizeButton.title = 'Minimize';
                fullScreenButton.style.display = '';
            }
        });

        // Full screen functionality
        fullScreenButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isFullScreen = !this.isFullScreen;

            if (this.isFullScreen) {
                chatContainer.classList.add('fullscreen');
                fullScreenButton.classList.add('active');
                fullScreenButton.textContent = '⤢';
                fullScreenButton.title = 'Exit Full Screen';

                minimizeButton.style.display = 'none';

            } else {
                chatContainer.classList.remove('fullscreen');
                fullScreenButton.classList.remove('active');
                fullScreenButton.textContent = '⤢';
                fullScreenButton.title = 'Full Screen';

                minimizeButton.style.display = '';

            }

            // Force scroll to bottom after resize
            setTimeout(() => {
                messages.scrollTop = messages.scrollHeight;
            }, 300);
        });

        // Send message functionality
        sendButton.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Minimize functionality
        minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.isFullScreen) {
                return;
            }
            this.isMinimized = !this.isMinimized;

            if (this.isMinimized) {
                chatContainer.classList.add('minimized');
                fullScreenButton.style.display = 'none';
                minimizeButton.style.display = 'none';
            } else {
                chatContainer.classList.remove('minimized');
                minimizeButton.textContent = '−';
                minimizeButton.title = 'Minimize';
                fullScreenButton.style.display = '';
            }
        });

        // Close functionality
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            chatContainer.style.display = 'none';
        });

        // Predefined question buttons
        questionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const questionText = button.textContent;
                this.handlePredefinedQuestion(questionText);
            });
        });
    }

    createMapMessage() {
        const mapMessageContainer = document.createElement('div');
        mapMessageContainer.className = 'message bot-message';

        const text = document.createElement('div');
        text.textContent = 'Evo lokacije na mapi:';
        mapMessageContainer.appendChild(text);

        const mapContainer = document.createElement('div');
        mapContainer.className = 'map-container';
        mapContainer.style.height = '250px';
        mapContainer.style.width = '100%';
        mapContainer.style.marginTop = '10px';
        mapContainer.style.borderRadius = '8px';
        mapMessageContainer.appendChild(mapContainer);

        const messages = this.shadowRoot.querySelector('.chat-messages');
        messages.appendChild(mapMessageContainer);

        setTimeout(() => this.initializeMap(mapContainer), 0);

        return mapMessageContainer;
    }

    initializeMap(container) {
        try {
            // **Define EPSG:32634 using Proj4js**
            proj4.defs("EPSG:32634", "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs");

            // **Register Proj4js with OpenLayers**
            ol.proj.proj4.register(proj4);

            // Get the projection object *after* registration
            const projection32634 = ol.proj.get('EPSG:32634');
            if (!projection32634) {
                console.error("EPSG:32634 projection object could not be retrieved after registration.");
                container.innerHTML = '<p style="color: red; padding: 10px;">Map Error: Projection setup failed.</p>';
                return;
            }

            const belgradeLonLat = [20.4612, 44.8125];

            // **Transform using OpenLayers' registered projection**
            const centerCoordsEPSG32634 = ol.proj.transform(belgradeLonLat, 'EPSG:4326', 'EPSG:32634');
            console.log('Belgrade LonLat:', belgradeLonLat);
            console.log('Transformed Center (EPSG:32634):', centerCoordsEPSG32634);

            // **Crucial Check:** Verify transformation result
            if (!centerCoordsEPSG32634 || centerCoordsEPSG32634.some(isNaN) || (centerCoordsEPSG32634[0] === 0 && centerCoordsEPSG32634[1] === 0)) {
                console.error("Coordinate transformation to EPSG:32634 failed or produced invalid result:", centerCoordsEPSG32634);
                container.innerHTML = '<p style="color: red; padding: 10px;">Map Error: Coordinate transformation failed.</p>';
                return;
            }

            // --- Base Layer (GeoSrbija WMS) ---
            const serbiaBaseLayer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: 'https://basemap.geosrbija.rs/basemap_cache/mapcache.ashx',
                    params: {
                        'LAYERS': 'ss30_2021_temp',
                        'FORMAT': 'image/jpeg',
                        'TRANSPARENT': 'FALSE',
                        'VERSION': '1.1.1',
                        'SERVICE': 'WMS',
                        'REQUEST': 'GetMap',
                        'STYLES': '',
                        'SRS': 'EPSG:32634'
                    },
                    projection: projection32634,
                    serverType: 'mapserver',
                    tileLoadFunction: function(imageTile, src) {
                        const img = imageTile.getImage();
                        img.onerror = function() {
                            console.error("Error loading tile:", src);
                        };
                        img.src = src;
                    }
                })
            });

            // --- Map View ---
            const mapView = new ol.View({
                projection: projection32634,
                center: centerCoordsEPSG32634,
                zoom: 10,
            });

            // --- Marker ---
            const markerFeature = new ol.Feature({
                geometry: new ol.geom.Point(centerCoordsEPSG32634)
            });
            const markerLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ features: [markerFeature] }),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({ color: 'rgba(51, 153, 204, 0.8)' }),
                        stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                    })
                })
            });

            // --- Map Initialization ---
            const map = new ol.Map({
                target: container,
                layers: [serbiaBaseLayer, markerLayer],
                view: mapView,
                controls: ol.control.defaults.defaults({
                    attribution: false, zoom: true
                }).extend([
                    new ol.control.ScaleLine({ units: 'metric' }),
                ])
            });

            // Update size after rendering (important within dynamic elements)
            setTimeout(() => {
                console.log("Updating map size...");
                map.updateSize();
                map.getView().setCenter(centerCoordsEPSG32634);
                console.log("Map center after update:", map.getView().getCenter());
                console.log("Map zoom after update:", map.getView().getZoom());
            }, 150);

        } catch (error) {
            console.error("Error initializing map:", error);
            container.innerHTML = `<p style="color: red; padding: 10px;">Map Error: ${error.message}</p>`;
        }
    }

    handlePredefinedQuestion(question) {
        const messages = this.shadowRoot.querySelector('.chat-messages');

        // Display the selected question as user message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-message';
        userMsg.textContent = question;
        messages.appendChild(userMsg);

        // Add loading indicator
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'message loading-message';
        const loadingDots = document.createElement('div');
        loadingDots.className = 'loading-dots';

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'loading-dot';
            loadingDots.appendChild(dot);
        }

        loadingMsg.appendChild(loadingDots);
        messages.appendChild(loadingMsg);

        messages.scrollTop = messages.scrollHeight;

        // Simulate bot response with delay
        setTimeout(() => {
            // Remove loading indicator
            messages.removeChild(loadingMsg);

            // Add bot response based on the question
            if (question === 'Prikaz na mapi') {
                // Create map message
                this.createMapMessage();
            } else
            if (question === 'Preuzmi pdf') {
                // For PDF download, create a message with the download button
                const botMsgContainer = document.createElement('div');
                botMsgContainer.className = 'message bot-message';

                const botText = document.createElement('div');
                botText.textContent = 'Preuzmite pdf klikom na dugme:';
                botMsgContainer.appendChild(botText);

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'pdf-download-btn';
                downloadBtn.textContent = 'Preuzmi pdf';
                downloadBtn.addEventListener('click', () => this.triggerPdfDownload());

                botMsgContainer.appendChild(downloadBtn);
                messages.appendChild(botMsgContainer);
            } else {
                // Regular text messages for other options
                const botMsg = document.createElement('div');
                botMsg.className = 'message bot-message';

                switch(question) {
                    case 'Pronađi adresu':
                        botMsg.textContent = 'Unesite ulicu i broj za traženu adresu.';
                        break;
                    case 'Pronađi parcelu':
                        botMsg.textContent = 'Unesite katastarsku opštinu i broj parcele.';
                        break;
                    default:
                        botMsg.textContent = 'Kako Vam još mogu pomoći?';
                }

                messages.appendChild(botMsg);
            }

            // Auto-scroll to the newest message
            messages.scrollTop = messages.scrollHeight;
        }, 1000);
    }

    triggerPdfDownload() {
        // Create and dispatch custom event to communicate with Angular app
        const event = new CustomEvent('pdf-download-requested', {
            bubbles: true,
            composed: true,
            detail: { timestamp: new Date().getTime() }
        });

        this.dispatchEvent(event);

        // Provide user feedback
        const messages = this.shadowRoot.querySelector('.chat-messages');
        const feedbackMsg = document.createElement('div');
        feedbackMsg.className = 'message bot-message';
        feedbackMsg.textContent = 'Zahtev za preuzimanje je poslat. Preuzimanje bi trebalo da počne uskoro.';
        messages.appendChild(feedbackMsg);
        messages.scrollTop = messages.scrollHeight;
    }

    sendMessage() {
        const input = this.shadowRoot.querySelector('input');
        const messages = this.shadowRoot.querySelector('.chat-messages');
        const text = input.value.trim();

        if (text) {
            // User message
            const userMsg = document.createElement('div');
            userMsg.className = 'message user-message';
            userMsg.textContent = text;
            messages.appendChild(userMsg);
            input.value = '';

            // Add loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'message loading-message';
            const loadingDots = document.createElement('div');
            loadingDots.className = 'loading-dots';

            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'loading-dot';
                loadingDots.appendChild(dot);
            }

            loadingMsg.appendChild(loadingDots);
            messages.appendChild(loadingMsg);

            // Auto-scroll to show loading indicator
            messages.scrollTop = messages.scrollHeight;

            // Simulate bot response with delay
            setTimeout(() => {
                // Remove loading indicator
                messages.removeChild(loadingMsg);

                // Add bot response
                if (text.toLowerCase().includes('pdf') ||
                    text.toLowerCase().includes('dokument') ||
                    text.toLowerCase().includes('preuzmi')) {

                    // Create a message with download button for PDF
                    const botMsgContainer = document.createElement('div');
                    botMsgContainer.className = 'message bot-message';

                    const botText = document.createElement('div');
                    botText.textContent = 'Preuzmite pdf klikom na dugme:';
                    botMsgContainer.appendChild(botText);

                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'pdf-download-btn';
                    downloadBtn.textContent = 'Preuzmi pdf';
                    downloadBtn.addEventListener('click', () => this.triggerPdfDownload());

                    botMsgContainer.appendChild(downloadBtn);
                    messages.appendChild(botMsgContainer);

                } else {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'message bot-message';

                    if (text.toLowerCase().includes('mapa') ||
                        text.toLowerCase().includes('karta') ||
                        text.toLowerCase().includes('lokacija')) {
                        botMsg.textContent = 'Kliknite na link da otvorite mapu sa trenutnom lokacijom.';
                    } else {
                        botMsg.textContent = 'Kako Vam mogu pomoći? Možete odabrati jednu od ponuđenih opcija ili napisati svoje pitanje.';
                    }

                    messages.appendChild(botMsg);
                }

                messages.scrollTop = messages.scrollHeight;
            }, 1000);
        }
    }
}

customElements.define('my-chat-widget', MyChatWidget);