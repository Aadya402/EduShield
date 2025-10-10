import os
import joblib
import pandas as pd
from datetime import date
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# --- Import the specific APIError for better error handling ---
from postgrest.exceptions import APIError

# --- INITIALIZATION ---
load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

# --- LOAD MODEL ---
model_path = os.path.join(os.path.dirname(__file__), 'fraud_detection_pipeline.pkl')
pipeline = joblib.load(model_path)

# --- CONNECT TO SUPABASE ---
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# --- HELPER FUNCTION ---
def calculate_age(born_str):
    if not born_str: return 30 # Default age
    born = date.fromisoformat(born_str)
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

# --- API ENDPOINT FOR PREDICTION ---
@app.route('/predict', methods=['POST'])
def predict_fraud():
    try:
        # 1. Get the data from the frontend's request
        form_data = request.get_json()
        # --- DEBUG PRINT 1: See what was received ---
        print("DEBUG: Data received from frontend:", form_data)

        # Rashi
        # --- ADD THIS BLOCK to check for multiple applications ---
        # Get the device fingerprint from the incoming data
        # device_fingerprint = form_data.get('device_fingerprint')
        # previous_apps_count = 0 # Default to 0

        # if device_fingerprint:
        #     try:
        #         # Query Supabase to count rows with the same fingerprint
        #         response = supabase.table('loan_applications').select(
        #             'id', count='exact'
        #         ).eq('device_fingerprint', device_fingerprint).execute()
                
        #         # The count is available in the response object
        #         previous_apps_count = response.count
        #         print(f"Found {previous_apps_count} previous applications from this device fingerprint.")

        #     except Exception as e:
        #         print(f"Supabase error checking device fingerprint: {e}")
        # --- END OF NEW BLOCK ---
        # --- 2. Prepare data for the ML model ---

        device_mismatch_flag = False  # Placeholder
        ip_mismatch_flag = False      # Placeholder
        # The feature names MUST match your training script
        age = calculate_age(form_data.get('date_of_birth'))
        hesitation_ms = form_data.get('behavioral_hesitation_ms', 0)
        hesitation_seconds = hesitation_ms / 1000.0 if hesitation_ms else 0
        previous_apps_count = 0
        features = {
            'age': age,
            'income': form_data.get('applicant_income', 0),
            'loan_amount': form_data.get('loan_amount', 0),
            'typing_speed': form_data.get('behavioral_wpm', 0), # UPDATED KEY
            'error_rate': form_data.get('behavioral_error_rate', 0), # UPDATED KEY
            'hesitation_time': hesitation_seconds,
            'device_mismatch': 0, # Placeholder
            'ip_mismatch': 0,     # Placeholder
            'multiple_applications': previous_apps_count,
            'credit_score': form_data.get('credit_score', 0)
        }
        feature_df = pd.DataFrame([features])

        # --- DEBUG PRINT 2: See what is going into the model ---
        print("DEBUG: Features being sent to the model:", features)

        # --- 3. Make the prediction ---
        fraud_probability = pipeline.predict_proba(feature_df)[:, 1][0]
        risk_score = int(fraud_probability * 100)
        
        # (This is a simplified insert. You'd add all form fields)
        insert_data = {
            # Personal Information
            "full_name": form_data.get("full_name"),
            "date_of_birth": form_data.get("date_of_birth"),
            "email": form_data.get("email"),
            "phone_number": form_data.get("phone_number"),
            "pan_number": form_data.get("pan_number"),
            "aadhar_number": form_data.get("aadhar_number"),
            "gender": form_data.get("gender"),
            "marital_status": form_data.get("marital_status"),
            "state": form_data.get("state"),
            "city": form_data.get("city"),
            "dependants": form_data.get("dependants"),
            "education_level": form_data.get("education_level"),
            "self_employed": form_data.get("self_employed"),

            # Financial Information
            "applicant_income": form_data.get("applicant_income"),
            "credit_score": form_data.get("credit_score"),
            "loan_amount": form_data.get("loan_amount"),
            "loan_term_months": form_data.get("loan_term_months"),
            
            # System & Model Information
            "applicant_ip_address": form_data.get("applicant_ip"),
            "device_fingerprint": form_data.get("device_fingerprint"), # Add this if you have the column
            "risk_score": risk_score,
            "status": 'Reviewed',
            "liveness_check_data": form_data.get("face_capture_data"),

            # --- NEW: SAVING ALL METRICS TO THE DATABASE ---
            
            "behavioral_wpm": int(form_data.get('behavioral_wpm', 0.0)),
            "behavioral_hesitation_ms": int(form_data.get('behavioral_hesitation_ms', 0)),
            "behavioral_error_rate": float(form_data.get('behavioral_error_rate', 0.0)),
            "multiple_applications": previous_apps_count,
            "device_mismatch": int(device_mismatch_flag), # Convert boolean to 0 or 1
            "ip_mismatch": int(ip_mismatch_flag) 
            
        }

        # Instead of RPC, we use the standard insert command
        response = supabase.table('loan_applications').insert(insert_data).execute()

        response = supabase.table('loan_applications').insert(insert_data).execute()
        print("DEBUG: Supabase insert response:", response)

        return jsonify({'message': 'Application processed successfully!', 'risk_score': risk_score})

    except Exception as e:
        # Check if the error is the specific 'duplicate key' error from the database
        if isinstance(e, APIError) and e.code == '23505':
            print("DEBUG: Duplicate key error ignored (allowing multiple applications).")
            # Still insert or just return success-style message
            return jsonify({'message': 'Duplicate application allowed. Entry ignored or overwritten.'}), 200

        
        # For all other errors, return a generic message
        import traceback
        print(f"An unexpected server error occurred: {e}")
        traceback.print_exc()
        return jsonify({'error': 'An unexpected server error occurred.'}), 500

# --- RUN THE APP ---
if __name__ == '__main__':
    app.run(debug=True)
 # Runs on http://127.0.0.1:5000
