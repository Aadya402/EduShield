document.addEventListener("DOMContentLoaded", () => {

    // initialize the client
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // -----------------------------

    const applyBtn = document.getElementById("apply-btn");
    const officerLoginBtn = document.getElementById("officer-login-btn");

    // Helper to show a custom message box 
    function showMessage(title, message) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <button onclick="this.closest('.custom-modal').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
        // Basic styling for the custom modal)
        const modalStyle = document.createElement('style');
        modalStyle.innerHTML = `
            .custom-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0, 0, 0, 0.5); display: flex; 
                justify-content: center; align-items: center; z-index: 9999;
            }
            .custom-modal .modal-content {
                background: white; padding: 30px; border-radius: 10px; 
                max-width: 400px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .custom-modal button {
                margin-top: 20px; background-color: #0077b6; color: white;
                border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;
            }
        `;
        document.head.appendChild(modalStyle);
    }

    // if (applyBtn) {
    //     applyBtn.addEventListener("click", () => {
    //         window.location.href = "applic.html"
    //     });
    // }

    // if (officerLoginBtn) {
    //     officerLoginBtn.addEventListener("click", () => {
    //         window.location.href = "officer.html";
    //     });
    // }

    // Rashi
        // --- A. Logic for index.html (Role Selection) ---

    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            // UPDATED: Points to the applicant authentication page
            window.location.href = "applicant_auth.html";
        });
    }

    if (officerLoginBtn) {
        officerLoginBtn.addEventListener("click", () => {
            // UPDATED: Points to the officer authentication page
            window.location.href = "officer_auth.html";
        });
    }

        // --- C. Logic for officer.html (Dashboard View Switching) ---
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    if (dashboardContainer) {
        // Define ALL necessary dashboard elements here
        const overviewPane = document.getElementById('overview');
        const applicantsPane = document.getElementById('applicants');
        const detailReviewPane = document.getElementById('detail-review');
        const viewApplicantsBtn = document.getElementById('view-applicants-btn');
        const backToOverviewBtn = document.getElementById('back-to-overview-btn');
        const applicantTable = document.getElementById('applicant-queue-table');
        const detailApplicantName = document.getElementById('detail-applicant-name');
        const backToQueueBtn = document.getElementById('back-to-queue-btn');

        // --- 1. Button View Switching Logic ---
        if (viewApplicantsBtn) {
            viewApplicantsBtn.addEventListener('click', () => {
                overviewPane.classList.remove('active');
                applicantsPane.classList.add('active');
            });
        }
        
        // Button: Applicants back to Overview
        if (backToOverviewBtn) {
            backToOverviewBtn.addEventListener('click', () => {
                applicantsPane.classList.remove('active');
                overviewPane.classList.add('active');
            });
        }

        // --- 2. Detail View Logic (Table Row Click) ---
        if (applicantTable) {
            applicantTable.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row || !row.dataset.applicantId) return; 

                const applicantName = row.querySelector('.applicant-name').textContent;

                // Hide Applicant List and show Detail
                applicantsPane.classList.remove('active');
                detailReviewPane.classList.add('active');
                
                // Update detail header
                detailApplicantName.textContent = `Reviewing: ${applicantName}`;
            });
        }
        
        // --- 3. Back Button Logic (Detail back to Applicants List) ---
        if (backToQueueBtn) {
            backToQueueBtn.addEventListener('click', () => {
                // Hide Detail Pane
                detailReviewPane.classList.remove('active');
                // Show Applicants Queue Tab
                applicantsPane.classList.add('active');
            });
        }
    }

    // --- Loan Application Form Submission ---
    const loanApplicationForm = document.getElementById("loan-application-form"); 
    
    // Check if the form exists 
    if (loanApplicationForm) {
        // Define button and consent check only WHEN the form is present
        const submitLoanBtn = document.getElementById("submit-loan-btn");
        const consentCheck = document.getElementById("consent-check");

        // Now, check if the button itself exists before trying to add a listener
        if (submitLoanBtn && consentCheck) {
            submitLoanBtn.addEventListener("click", async () => {
                // Rashi
                // Face Capture
                const faceCaptureData = document.getElementById('face-capture-data').value;
                if (!faceCaptureData) {
                    showMessage("Verification Required", "Please complete the face capture step before submitting.");
                    return; // Stop the submission
                }
                // ... (Your validation checks remain the same)
                if (!loanApplicationForm.checkValidity()) {
                    loanApplicationForm.reportValidity();
                    return;
                }
                const consentCheck = document.getElementById("consent-check");
                if (!consentCheck.checked) {
                    showMessage("Consent Required", "Please agree to the Terms & Conditions to submit your application.");
                    return;
                }

                // --- 1. Generate the device fingerprint ---
                let deviceFingerprint = null;
                try {
                    // This calls the function from fingerprint.js
                    deviceFingerprint = await generateDeviceFingerprint();
                    console.log("Device Fingerprint:", deviceFingerprint);
                } catch (fingerprintError) {
                    console.error("Could not generate device fingerprint:", fingerprintError);
                }
                // --- END OF SNIPPET TO ADD ---

                // --- 1. Fetch the public IP address from ipify ---
                let publicIp = null;
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    publicIp = data.ip;
                } catch (ipError) {
                    console.error("Could not fetch IP address:", ipError);
                    // Decide if you want to proceed without an IP or show an error
                }

                // --- 2. Gather form data ---
                const formData = {
                    full_name: document.getElementById("full-name").value,
                    date_of_birth: document.getElementById("date-of-birth").value,
                    email: document.getElementById("email").value,
                    phone_number: document.getElementById("phone-number").value,
                    pan_number: document.getElementById("pan-number").value,
                    aadhar_number: document.getElementById("aadhar-number").value,
                    state: document.getElementById("state").value,
                    city: document.getElementById("city").value,
                    gender: document.getElementById("gender").value,
                    marital_status: document.getElementById("marital-status").value,
                    dependants: parseInt(document.getElementById("dependants").value),
                    self_employed: document.getElementById("self-employed").checked,
                    education_level: document.getElementById("education-level").value,
                    applicant_income: parseFloat(document.getElementById("applicant-income").value),
                    credit_score: parseInt(document.getElementById("credit-score").value),
                    loan_amount: parseFloat(document.getElementById("loan-amount").value),
                    loan_term_months: parseInt(document.getElementById("loan-term").value),
                    applicant_ip: publicIp, 
                    device_fingerprint: deviceFingerprint,
                    // face_image_base64: faceCaptureData
                };

                // aadya

                // --- 3. Call the Flask API instead of the RPC function ---
                try {
                    const response = await fetch('http://127.0.0.1:5000/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        // If the server returned an error (e.g., 500)
                        throw new Error(result.error || 'An unknown error occurred.');
                    }
                    
                    // --- Handle the successful response ---
                    showMessage(
                        "Submission Complete! 🎉",
                        //`Your application has been processed with a risk score of ${result.risk_score}.`
                    );
                    loanApplicationForm.reset();

                } catch (error) {
                    console.error('API Error:', error);
                    showMessage("Submission Failed", `An error occurred: ${error.message}. Please try again.`);
                }
            });
        }
    }     

}); 
