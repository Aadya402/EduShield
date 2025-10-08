document.addEventListener("DOMContentLoaded", () => {
    // --- SUPABASE CLIENT SETUP ---
    // The SUPABASE_URL and SUPABASE_ANON_KEY variables are loaded from env.js
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // --- DOM ELEMENTS ---
    const signInForm = document.getElementById("sign-in-form");
    const signUpForm = document.getElementById("sign-up-form");
    const toggleLinks = document.querySelectorAll(".toggle-link");

    // --- DETERMINE ROLE FROM URL ---
    // This is how the script knows whether to use the 'applicants' or 'officers' table.
    const isOfficerPage = window.location.pathname.includes("officer_auth.html");
    const role = isOfficerPage ? "officer" : "applicant";
    const tableName = isOfficerPage ? "officers" : "applicants";
    const redirectUrl = isOfficerPage ? "officer.html" : "applic.html";

    // --- HELPER FUNCTION FOR MESSAGES ---
    function showMessage(title, message, isError = false) {
        const existingModal = document.querySelector('.custom-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content ${isError ? 'error' : ''}">
                <h3>${title}</h3>
                <p>${message}</p>
                <button onclick="this.closest('.custom-modal').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // --- FORM TOGGLING LOGIC ---
    toggleLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            signInForm.classList.toggle("active");
            signUpForm.classList.toggle("active");
        });
    });

    // --- SIGN UP LOGIC ---
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullName = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        // Step 1: Create the user in Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            showMessage("Sign Up Failed", error.message, true);
            return;
        }

        // Step 2: If auth user is created, insert their profile into our public table
        if (data.user) {
            const { error: profileError } = await supabaseClient
                .from(tableName)
                .insert([{ 
                    id: data.user.id, 
                    full_name: fullName,
                    email: email 
                }]);

            if (profileError) {
                // This is a rare case, but important to handle
                showMessage("Sign Up Failed", `Could not create user profile: ${profileError.message}`, true);
                return;
            }
            
            showMessage("Success!", "Please check your email for a confirmation link to complete your registration.");
            signUpForm.reset();
            // Toggle back to the sign-in form
            signInForm.classList.add("active");
            signUpForm.classList.remove("active");
        }
    });

    // --- SIGN IN LOGIC ---
    // aadya
    
    // In auth.js

// --- SIGN IN LOGIC ---
signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showMessage("Sign In Failed", error.message, true);
        return;
    }

    // If login is successful, execute the new logic
    if (data.user) {
        // --- ADD THIS BLOCK TO CAPTURE AND UPDATE GEOLOCATION ---
        try {
            // 1. Fetch the geolocation data from the API
            const response = await fetch('http://ip-api.com/json');
            if (!response.ok) {
                throw new Error('Could not fetch geolocation');
            }
            const ipData = await response.json();

            // 2. Call the RPC function to save the data in your 'applicants' or 'officers' table
            // The 'tableName' variable correctly identifies whether the user is an applicant or officer
            const { error: rpcError } = await supabaseClient.rpc('update_last_login_info', {
                geolocation_data: ipData,
                target_table: tableName // Pass the table name to the function
            });

            if (rpcError) {
                // Log the error but don't block the user from signing in
                console.error('Could not update last login info:', rpcError);
            } else {
                console.log('Successfully updated last login info.');
            }

        } catch (fetchError) {
            console.error('Geolocation fetch error:', fetchError);
        }
        // --- END OF BLOCK TO ADD ---

        // 3. Redirect the user to the correct page (this line already exists)
        window.location.href = redirectUrl;
    }
});
});
