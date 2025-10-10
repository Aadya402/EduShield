import os
import joblib
import pandas as pd
from datetime import date
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

from postgrest.exceptions import APIError

load_dotenv() 

app = Flask(__name__)
CORS(app) 

model_path = os.path.join(os.path.dirname(__file__), 'fraud_detection_pipeline.pkl')
pipeline = joblib.load(model_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def calculate_age(born_str):
    if not born_str: return 30 
    born = date.fromisoformat(born_str)
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

@app.route('/predict', methods=['POST'])
def predict_fraud():
    try:
        form_data = request.get_json()
        print("DEBUG: Data received from frontend:", form_data)

        device_mismatch_flag = False 
        ip_mismatch_flag = False     

        age = calculate_age(form_data.get('date_of_birth'))
        hesitation_ms = form_data.get('behavioral_hesitation_ms', 0)
        hesitation_seconds = hesitation_ms / 1000.0 if hesitation_ms else 0
        previous_apps_count = 0
        features = {
            'age': age,
            'income': form_data.get('applicant_income', 0),
            'loan_amount': form_data.get('loan_amount', 0),
            'typing_speed': form_data.get('behavioral_wpm', 0), 
            'error_rate': form_data.get('behavioral_error_rate', 0), 
            'hesitation_time': hesitation_seconds,
            'device_mismatch': 0, 
            'ip_mismatch': 0,     
            'multiple_applications': previous_apps_count,
            'credit_score': form_data.get('credit_score', 0)
        }
        feature_df = pd.DataFrame([features])

        print("DEBUG: Features being sent to the model:", features)

        fraud_probability = pipeline.predict_proba(feature_df)[:, 1][0]
        risk_score = int(fraud_probability * 100)

        insert_data = {
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

            "applicant_income": form_data.get("applicant_income"),
            "credit_score": form_data.get("credit_score"),
            "loan_amount": form_data.get("loan_amount"),
            "loan_term_months": form_data.get("loan_term_months"),

            "applicant_ip_address": form_data.get("applicant_ip"),
            "device_fingerprint": form_data.get("device_fingerprint"), 
            "risk_score": risk_score,
            "status": 'Reviewed',
            "liveness_check_data": form_data.get("face_capture_data"),
            
            "behavioral_wpm": int(form_data.get('behavioral_wpm', 0.0)),
            "behavioral_hesitation_ms": int(form_data.get('behavioral_hesitation_ms', 0)),
            "behavioral_error_rate": float(form_data.get('behavioral_error_rate', 0.0)),
            "multiple_applications": previous_apps_count,
            "device_mismatch": int(device_mismatch_flag), 
            "ip_mismatch": int(ip_mismatch_flag) 
            
        }

        response = supabase.table('loan_applications').insert(insert_data).execute()
        response = supabase.table('loan_applications').insert(insert_data).execute()
        print("DEBUG: Supabase insert response:", response)

        return jsonify({'message': 'Application processed successfully!', 'risk_score': risk_score})

    except Exception as e:
        if isinstance(e, APIError) and e.code == '23505':
            print("DEBUG: Duplicate key error ignored (allowing multiple applications).")
            return jsonify({'message': 'Duplicate application allowed. Entry ignored or overwritten.'}), 200

        import traceback
        print(f"An unexpected server error occurred: {e}")
        traceback.print_exc()
        return jsonify({'error': 'An unexpected server error occurred.'}), 500

if __name__ == '__main__':
    app.run(debug=True)
 # Runs on http://127.0.0.1:5000
