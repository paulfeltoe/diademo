class PrescriptionTracker {
    constructor() {
        // Only initialize if required elements exist
        if (document.getElementById('prescription-widget')) {
            this.initializeElements();
            this.initializeMap();
            this.attachEventListeners();
        }
    }

    initializeElements() {
        this.widget = document.getElementById('prescription-widget');
        this.bottomSheet = document.getElementById('prescriptionSheet');
        this.openButton = document.getElementById('openPrescriptionSheet');
        this.closeButton = document.getElementById('closePrescriptionSheet');
        
        // Create and append overlay if it doesn't exist
        if (!document.getElementById('prescription-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'prescription-overlay';
            this.overlay.className = 'overlay';
            document.body.appendChild(this.overlay);
        } else {
            this.overlay = document.getElementById('prescription-overlay');
        }
    }

    initializeMap() {
        // Initialize OpenStreetMap
        const mapElement = document.getElementById('pharmacy-map');
        if (mapElement) {
            // McGill University Health Services coordinates
            const lat = 45.5031;
            const lon = -73.5777;
            
            // Create the map iframe
            const mapIframe = document.createElement('iframe');
            mapIframe.style.width = '100%';
            mapIframe.style.height = '100%';
            mapIframe.style.border = 'none';
            mapIframe.style.borderRadius = '8px';
            
            // Use OpenStreetMap with the coordinates
            mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.005}%2C${lat-0.005}%2C${lon+0.005}%2C${lat+0.005}&layer=mapnik&marker=${lat}%2C${lon}`;
            
            mapElement.appendChild(mapIframe);
        }
    }

    attachEventListeners() {
        // Only attach listeners if elements exist
        if (this.openButton) {
            this.openButton.addEventListener('click', () => {
                this.bottomSheet.classList.add('active');
                this.overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeBottomSheet());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeBottomSheet());
        }

        // Handle delivery option toggle
        if (this.bottomSheet) {
            const deliveryOptions = this.bottomSheet.querySelectorAll('.option-button');
            const deliveryForm = this.bottomSheet.querySelector('.delivery-form');

            if (deliveryOptions && deliveryForm) {
                deliveryOptions.forEach(button => {
                    button.addEventListener('click', () => {
                        deliveryOptions.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        
                        if (button.textContent.trim() === 'Delivery') {
                            deliveryForm.classList.remove('hidden');
                        } else {
                            deliveryForm.classList.add('hidden');
                        }
                    });
                });
            }

            // Enable notifications
            const notifyButton = this.bottomSheet.querySelector('.primary-button');
            if (notifyButton) {
                notifyButton.addEventListener('click', () => this.enableNotifications());
            }

            // Call pharmacy
            const callButton = this.bottomSheet.querySelector('.secondary-button');
            if (callButton) {
                callButton.addEventListener('click', () => {
                    window.location.href = 'tel:2065550123';
                });
            }
        }
    }

    closeBottomSheet() {
        this.bottomSheet.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    async enableNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                alert('Notifications enabled! We\'ll keep you updated on your prescription status.');
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
        }
    }

    updateStatus(status) {
        const statusBadge = this.widget.querySelector('.status-badge');
        statusBadge.textContent = status;
        statusBadge.className = `status-badge ${status.toLowerCase()}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tracker = new PrescriptionTracker();
}); 