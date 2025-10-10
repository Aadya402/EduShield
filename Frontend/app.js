document.addEventListener("DOMContentLoaded", () => {

    // initialize the client
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const applyBtn = document.getElementById("apply-btn");
    const officerLoginBtn = document.getElementById("officer-login-btn");

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
        // --- Role Selection ---
    if (applyBtn) {
        applyBtn.addEventListener("click", () => {
            window.location.href = "applicant_auth.html";
        });
    }
    if (officerLoginBtn) {
        officerLoginBtn.addEventListener("click", () => {
            window.location.href = "officer_auth.html";
        });
    }
        // --- Dashboard View Switching ---
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        function populateDetailView(app) {
            if (!app) return;

            // --- 1. Financial Data ---
            document.getElementById('detail-full-name').textContent = app.full_name || '--';
            document.getElementById('detail-email').textContent = app.email || '--';
            document.getElementById('detail-phone').textContent = app.phone_number || '--';
            document.getElementById('detail-marital-status').textContent = app.marital_status || '--';
            document.getElementById('detail-dependants').textContent = app.dependants ?? '--';
            document.getElementById('detail-self-employed').textContent = app.self_employed ? 'Yes' : 'No';
            document.getElementById('detail-education').textContent = app.education_level || '--';
            document.getElementById('detail-income').textContent = `₹ ${new Intl.NumberFormat('en-IN').format(app.applicant_income)}` || '--';
            document.getElementById('detail-loan-term').textContent = `${app.loan_term_months} months` || '--';
            document.getElementById('detail-credit-score').textContent = app.credit_score || '--';

            // --- 2. AI Fraud Insights ---
            const riskGauge = document.getElementById('detail-risk-gauge');
            const riskScore = app.risk_score || 0;
            riskGauge.innerHTML = `Risk Score: <span class="score-value">${riskScore}/100</span>`;
            riskGauge.querySelector('.score-value').className = riskScore > 75 ? 'score-value high' : 'score-value low';
            const metricsContainer = document.getElementById('detail-metrics-container');
            let metricsHTML = '<h4>AI & Behavioral Metrics</h4>';

            // 1. Typing Speed
            const wpm = Math.round(app.behavioral_wpm ?? 0);
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">Typing Speed (WPM):</span>
                    <span class="data-value ${wpm > 90 ? 'red-flag' : ''}">${wpm}</span>
                </div>`;
            // 2. Error/Correction Rate
            const errorRate = ((app.behavioral_error_rate ?? 0) * 100).toFixed(1);
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">Correction Rate:</span>
                    <span class="data-value ${errorRate > 2.5 ? 'red-flag' : ''}">${errorRate}%</span>
                </div>`;
            // 3. Hesitation Time
            const hesitation = Math.round(app.behavioral_hesitation_ms ?? 0);
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">Avg. Hesitation (ms):</span>
                    <span class="data-value ${hesitation > 2000 ? 'yellow-flag' : ''}">${hesitation}</span>
                </div>`;
            // 4. Multiple Applications from Same Device
            const appCount = app.multiple_applications ?? 0;
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">Previous Applications (Device):</span>
                    <span class="data-value ${appCount > 1 ? 'yellow-flag' : ''}">${appCount}</span>
                </div>`;
            // 5. Device Mismatch
            const deviceMismatch = app.device_mismatch === 1;
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">Device Type Mismatch:</span>
                    <span class="data-value ${deviceMismatch ? 'red-flag' : ''}">${deviceMismatch ? 'Yes' : 'No'}</span>
                </div>`;
            // 6. IP Mismatch
            const ipMismatch = app.ip_mismatch === 1;
            metricsHTML += `
                <div class="data-pair">
                    <span class="data-label">IP-Geography Mismatch:</span>
                    <span class="data-value ${ipMismatch ? 'red-flag' : ''}">${ipMismatch ? 'Yes' : 'No'}</span>
                </div>`;
            metricsContainer.innerHTML = metricsHTML;
        }
        async function updateDashboardKPIs() {
            // 1. Get Date Ranges for "Today" and "This Week"
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

            // 2. Fetch all data in parallel for efficiency
            const [highRisk, approvedToday, totalWeek] = await Promise.all([
                // Count applications with risk score > 75
                supabaseClient.from('loan_applications').select('id', { count: 'exact' }).gt('risk_score', 75),
                // Count 'Approved' applications since the start of today
                supabaseClient.from('loan_applications').select('id', { count: 'exact' }).eq('status', 'Approved').gte('created_at', todayStart),
                // Count all applications since the start of the week
                supabaseClient.from('loan_applications').select('id', { count: 'exact' }).gte('created_at', weekStart)
            ]);

            // 3. Update the HTML elements with the fetched counts
            document.getElementById('kpi-high-risk-value').textContent = highRisk.count ?? 0;
            document.getElementById('kpi-approved-today-value').textContent = approvedToday.count ?? 0;
            document.getElementById('kpi-total-week-value').textContent = totalWeek.count ?? 0;
        }
        // --- END OF FUNCTION ---
        // --- ADD THIS ENTIRE FUNCTION ---
        async function fetchAndDisplayApplications() {
            const tableBody = document.querySelector('#applicant-queue-table tbody');
            if (!tableBody) return;

            // 1. Fetch data from the 'loan_applications' table in Supabase
            const { data: applications, error } = await supabaseClient
                .from('loan_applications')
                .select('*') // Get all columns
                .order('created_at', { ascending: false }); // Show newest first

            if (error) {
                console.error("Error fetching applications:", error);
                tableBody.innerHTML = `<tr><td colspan="6">Error loading data. Please check the console.</td></tr>`;
                return;
            }

            // 2. Clear any existing mock data from the table
            tableBody.innerHTML = '';

            if (applications.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No new applications found.</td></tr>`;
                return;
            }

            // 3. Loop through the fetched data and create a table row for each application
            applications.forEach(app => {
                const row = document.createElement('tr');
                // Set the data-applicant-id so your existing "Review" button logic works
                row.dataset.applicantId = app.id;

                // Determine the CSS class for the risk score based on its value
                let riskClass = 'low';
                if (app.risk_score > 75) {
                    riskClass = 'high';
                } else if (app.risk_score > 40) {
                    riskClass = 'medium';
                }

                // Format the date to be more readable (YYYY-MM-DD)
                const formattedDate = new Date(app.created_at).toLocaleDateString('en-CA');

                // Populate the row with data
                row.innerHTML = `
                    <td class="applicant-name">${app.full_name}</td>
                    <td>${new Intl.NumberFormat('en-IN').format(app.loan_amount)}</td>
                    <td class="risk-score ${riskClass}">${app.risk_score}</td>
                    <td class="status ${app.status.toLowerCase().replace(/\s+/g, '-')}">${app.status}</td>
                    <td>${formattedDate}</td>
                    <td><button class="review-btn">Review</button></td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        // --- END OF FUNCTION ---
        // Define ALL necessary dashboard elements here
        const overviewPane = document.getElementById('overview');
        const applicantsPane = document.getElementById('applicants');
        const detailReviewPane = document.getElementById('detail-review');
        const viewApplicantsBtn = document.getElementById('view-applicants-btn');
        const backToOverviewBtn = document.getElementById('back-to-overview-btn');
        const applicantTable = document.getElementById('applicant-queue-table');
        const detailApplicantName = document.getElementById('detail-applicant-name');
        const backToQueueBtn = document.getElementById('back-to-queue-btn');

        updateDashboardKPIs();
        fetchAndDisplayApplications();

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

        // --- 3. MODIFY THE DETAIL VIEW LOGIC ---
            if (applicantTable) {
                applicantTable.addEventListener('click', async (e) => {
                    // Target the button specifically, not the whole row
                    if (!e.target.classList.contains('review-btn')) return;

                    const row = e.target.closest('tr');
                    const applicantId = row.dataset.applicantId;
                    if (!applicantId) return;

                    // Fetch the FULL data for this specific applicant
                    const { data: applicant, error } = await supabaseClient
                        .from('loan_applications')
                        .select('*')
                        .eq('id', applicantId)
                        .single(); // .single() gets one object instead of an array

                    if (error) {
                        console.error("Error fetching applicant details:", error);
                        return;
                    }

                    // Call our new function to populate the view with the fetched data
                    populateDetailView(applicant);

                    // Hide Applicant List and show Detail view
                    applicantsPane.classList.remove('active');
                    detailReviewPane.classList.add('active');
                    
                    // Update detail header
                    detailApplicantName.textContent = `Reviewing: ${applicant.full_name}`;
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
                // --- ADD THIS SNIPPET ---
                // --- 2. Get behavioral metrics ---
                let behavioralMetrics = null;
                try {
                    // This calls the global function from behavioral-analytics.js
                    behavioralMetrics = getBehavioralMetrics(); 
                    console.log("Behavioral Metrics collected:", behavioralMetrics);
                } catch (behaviorError) {
                    console.error("Could not collect behavioral metrics:", behaviorError);
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
                    face_capture_data: JSON.parse(document.getElementById('face-capture-data').value),

                    behavioral_wpm: behavioralMetrics ? behavioralMetrics.averageWPM : null,
                    behavioral_error_rate: behavioralMetrics ? (behavioralMetrics.totalCorrections / behavioralMetrics.totalKeyPresses) : null,
                    behavioral_hesitation_ms: behavioralMetrics ? behavioralMetrics.averageHesitationTime : null,
                };

                 // --- ADD THIS LINE FOR DEBUGGING ---
                                console.log("DEBUG: Data being sent to Flask API:", formData);

                // --- 3. Call the Flask API instead of the RPC function ---
                // In app.js, replace your entire try...catch block with this final version:

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
                        // THIS IS THE KEY CHANGE:
                        // We check the status code and set the title accordingly.
                        const errorTitle = response.status === 409 ? "Duplicate Application" : "Submission Failed";
                        showMessage(errorTitle, result.error); // Use the new title and clean message
                        return; // Stop the function
                    }
                    
                    // --- Handle the successful response ---
                    showMessage(
                        "Submission Complete! 🎉",
                        `Your application has been processed.`
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






