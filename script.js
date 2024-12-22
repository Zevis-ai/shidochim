// Firebase configuration
const firebaseConfig = {
    apiKey: window.ENV?.FIREBASE_API_KEY,
    authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN,
    databaseURL: window.ENV?.FIREBASE_DATABASE_URL,
    projectId: window.ENV?.FIREBASE_PROJECT_ID,
    storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.ENV?.FIREBASE_APP_ID
};

// Check if all Firebase configuration values are present
//if (!Object.values(firebaseConfig).every(value => value)) {
 //   console.error('Missing Firebase configuration. Please make sure all environment variables are set.');
//}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global variables
let currentStep = 0;

// Function declarations
function initPhotoUpload() {
    const uploadArea = document.getElementById('photoUploadArea');
    const fileInput = document.getElementById('photo');
    
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handlePhotoUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePhotoUpload(e.target.files[0]);
        }
    });
}

function handlePhotoUpload(file) {
    const uploadArea = document.getElementById('photoUploadArea');
    if (!uploadArea) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadArea.style.backgroundImage = `url(${e.target.result})`;
        uploadArea.style.backgroundSize = 'cover';
        uploadArea.style.backgroundPosition = 'center';
        uploadArea.innerHTML = '<div class="photo-overlay"><i class="fas fa-edit"></i> שינוי תמונה</div>';
    };
    reader.readAsDataURL(file);
}

function showSection(stepNumber) {
    const form = document.getElementById('matchmakingForm');
    if (!form) return;

    const sections = form.getElementsByClassName('form-section');
    const prevButton = form.querySelector('.prev-button');
    const nextButton = form.querySelector('.next-button');
    const submitButton = form.querySelector('.submit-button');

    Array.from(sections).forEach((section, index) => {
        section.classList.toggle('active', index === stepNumber);
    });

    // Update button visibility
    if (prevButton) {
        prevButton.style.display = stepNumber === 0 ? 'none' : 'block';
    }
    
    // Show submit button on last section, next button otherwise
    if (nextButton && submitButton) {
        const isLastSection = stepNumber === sections.length - 1;
        nextButton.style.display = isLastSection ? 'none' : 'block';
        submitButton.style.display = isLastSection ? 'block' : 'none';
    }
}

function updateProgressIndicator(step) {
    // Remove active class from all steps
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((stepElement, index) => {
        stepElement.classList.remove('active');
        if (index < step) {
            stepElement.classList.add('completed');
        } else {
            stepElement.classList.remove('completed');
        }
    });

    // Add active class to current step
    if (progressSteps[step]) {
        progressSteps[step].classList.add('active');
    }
}

function goToStep(step) {
    currentStep = step;
    showSection(currentStep);
    updateProgressIndicator(currentStep);
}

function validateCurrentSection() {
    const form = document.getElementById('matchmakingForm');
    if (!form) return true;

    const sections = form.getElementsByClassName('form-section');
    const currentSection = sections[currentStep];
    const inputs = currentSection.querySelectorAll('input[required], select[required]');
    
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

function collectFormData() {
    const form = document.getElementById('matchmakingForm');
    if (!form) {
        console.error('Form not found');
        return {};
    }

    const data = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.id) {
            data[input.id] = input.value;
        }
    });
    
    console.log('Collected form data:', data);
    return data;
}

async function submitForm() {
    try {
        console.log('Starting form submission...');
        const formData = collectFormData();
        
        // Add timestamp
        formData.submittedAt = new Date().toISOString();
        console.log('Form data with timestamp:', formData);
        
        // Save to Realtime Database
        console.log('Saving to Firebase...');
        const applicationsRef = firebase.database().ref('applications');
        const newApplicationRef = applicationsRef.push();
        
        await newApplicationRef.set(formData);
        console.log('Successfully saved to Firebase with key:', newApplicationRef.key);
        
        alert('הטופס נשלח בהצלחה! מספר הרשמה: ' + newApplicationRef.key);
        
        const form = document.getElementById('matchmakingForm');
        if (form) {
            form.reset();
            goToStep(0);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב מאוחר יותר.');
    }
}

// Toggle other occupation field visibility
function toggleOtherOccupation() {
    const occupationSelect = document.getElementById('occupation');
    const otherOccupationGroup = document.getElementById('otherOccupationGroup');
    
    if (occupationSelect && otherOccupationGroup) {
        otherOccupationGroup.style.display = 
            occupationSelect.value === 'other' ? 'block' : 'none';
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('matchmakingForm');
    
    if (form) {
        console.log('Form found, initializing...');
        
        // Initialize the first section and progress indicator
        showSection(currentStep);
        updateProgressIndicator(currentStep);

        // Add navigation button event listeners
        const prevButton = form.querySelector('.prev-button');
        const nextButton = form.querySelector('.next-button');
        const submitButton = form.querySelector('.submit-button');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (currentStep > 0) {
                    goToStep(currentStep - 1);
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (validateCurrentSection()) {
                    goToStep(currentStep + 1);
                }
            });
        }

        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (validateCurrentSection()) {
                    submitForm();
                }
            });
        }

        // Initialize photo upload if the element exists
        initPhotoUpload();
        
        // Initialize occupation field toggle
        const occupationSelect = document.getElementById('occupation');
        if (occupationSelect) {
            occupationSelect.addEventListener('change', toggleOtherOccupation);
            toggleOtherOccupation(); // Initial check
        }

        // Add error class removal on input
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('error');
            });
        });

        // Initialize Hebrew date selectors
        const hebrewDaySelect = document.getElementById('hebrewDay');
        if (hebrewDaySelect) {
            hebrewDaySelect.innerHTML = '<option value="">יום</option>';
            for(let i = 1; i <= 30; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString();
                hebrewDaySelect.appendChild(option);
            }
        }

        const hebrewYearSelect = document.getElementById('hebrewYear');
        if (hebrewYearSelect) {
            hebrewYearSelect.innerHTML = '<option value="">שנה</option>';
            const startYear = 5750; // תש"ן
            const currentYear = new Date().getFullYear() + 3760;
            for(let i = startYear; i <= currentYear; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString();
                hebrewYearSelect.appendChild(option);
            }
        }
    } else {
        console.error('Form not found');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const successMessage = document.getElementById('successMessage');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // מניעת שליחה רגילה של הטופס

        // הצגת הודעת הצלחה
        successMessage.style.display = 'block';

        // הסתרת הודעת ההצלחה לאחר 3 שניות
        setTimeout(() => {
            successMessage.style.display = 'none';
            form.reset(); // איפוס הטופס
        }, 3000);
    });
});