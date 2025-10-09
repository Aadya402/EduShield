import os
import joblib
import pandas as pd
from datetime import date
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

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

        # --- 2. Prepare data for the ML model ---
        # The feature names MUST match your training script
        age = calculate_age(form_data.get('date_of_birth'))
        features = {
            'age': age,
            'income': form_data.get('applicant_income', 0),
            'loan_amount': form_data.get('loan_amount', 0),
            'typing_speed': form_data.get('typing_speed', 0),
            'error_rate': form_data.get('error_rate', 0),
            'hesitation_time': form_data.get('hesitation_time', 0),
            'device_mismatch': 0, # Placeholder
            'ip_mismatch': 0,     # Placeholder
            'multiple_applications': 0, # Placeholder
            'credit_score': form_data.get('credit_score', 0)
        }
        feature_df = pd.DataFrame([features])

        # --- 3. Make the prediction ---
        fraud_probability = pipeline.predict_proba(feature_df)[:, 1][0]
        risk_score = int(fraud_probability * 100)

        # --- 4. Save to Supabase and return the result ---
        # Note: In this version, we save the data and score at the same time.
        # This assumes your frontend sends ALL the data needed for the table.
        
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
            "liveness_check_data": form_data.get("face_capture_data")
        }

        # Instead of RPC, we use the standard insert command
        response = supabase.table('loan_applications').insert(insert_data).execute()

        return jsonify({
            'message': 'Application processed successfully!',
            'risk_score': risk_score,
            'fraud_probability': fraud_probability
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500

# --- RUN THE APP ---
if __name__ == '__main__':
    app.run(debug=True) # Runs on http://127.0.0.1:5000
