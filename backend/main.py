import pandas as pd
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
import os
from dotenv import load_dotenv
from databricks_repo import DatabricksConfig, DatabricksRepo

def generate_random_parameters(crop_name):
    if crop_name not in minmax_values.index:
        return None

    params = {}
    for feature in feature_cols:
        min_val = minmax_values.loc[crop_name][feature]["min"]
        max_val = minmax_values.loc[crop_name][feature]["max"]


        val = random.uniform(min_val, max_val)

        params[feature] = round(float(val), 3)

    return params
def load_crop_data():
    try:

        df = repo.get_all_crops()

        print("Loaded crop data from Databricks")
        return df
    except Exception as e:
        print(f"Databricks unavailable, falling back to CSV: {e}")
        return pd.read_csv("crops.csv", sep=";")

load_dotenv()

host = os.getenv("DATABRICKS_SERVER_HOSTNAME")
path = os.getenv("DATABRICKS_HTTP_PATH")
token = os.getenv("DATABRICKS_TOKEN")

assert host, "Missing DATABRICKS_SERVER_HOSTNAME"
assert path, "Missing DATABRICKS_HTTP_PATH"
assert token, "Missing DATABRICKS_TOKEN"

cfg = DatabricksConfig(
    server_hostname=host,
    http_path=path,
    access_token=token,
    catalog="workspace",
    schema="default"
)

repo = DatabricksRepo(cfg)

df = load_crop_data()

for col in ["Temperature", "Humidity", "Rainfall", "Nitrogen", "Potassium", "Phosphorous"]:
    df[col] = pd.to_numeric(df[col], errors='coerce')


df.dropna(subset=["Temperature", "Humidity", "Rainfall", "Nitrogen", "Potassium", "Phosphorous"], inplace=True)


feature_cols = ["Temperature", "Humidity", "Rainfall", "Nitrogen", "Potassium", "Phosphorous"]
X = df[feature_cols]
y = df["Crop Type"]

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X, y_encoded)


avg_by_crop = df.groupby("Crop Type")[feature_cols].mean()

average_values = avg_by_crop.to_dict(orient="index")

minmax_values = (
    df.groupby("Crop Type")[feature_cols]
      .agg(['min', 'max'])
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

@app.route("/suggest", methods=["POST"])
def suggest():
    """
    Expects JSON:
    {
        "Temperature": ...,
        "Humidity": ...,
        "Rainfall": ...,
        "Nitrogen": ...,
        "Potassium": ...,
        "Phosphorous": ...
    }
    Returns top 3 predicted crops.
    """
    data = request.get_json()

    try:
        values = [data[col] for col in feature_cols]
    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400

    distances, indices = knn.kneighbors([values], n_neighbors=5)  # ask for more neighbors

    top_crops_encoded = y_encoded[indices[0]]
    top_crops = label_encoder.inverse_transform(top_crops_encoded)

    unique_crops = []
    for crop in top_crops:
        if crop not in unique_crops:
            unique_crops.append(crop)
        if len(unique_crops) == 3:
            break

    return jsonify({"suggestions": unique_crops})


@app.route("/average", methods=["GET"])
def average():
    """Return a JSON of average characteristics per crop."""
    return jsonify(average_values)

@app.route("/sensor", methods=["POST"])
def sensor():
    """
    Expects JSON:
    {
        "count": <number of crops>,
        "crops": ["Wheat", "Rice", ...]
    }

    Returns random realistic values for each crop:
    {
        "results": [
            { "crop": "Wheat", "parameters": {...} },
            ...
        ]
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing or invalid JSON body"}), 400

    count = data.get("count")
    crops = data.get("crops")

    if not isinstance(count, int) or count <= 0:
        return jsonify({"error": "'count' must be a positive integer"}), 400

    if not isinstance(crops, list) or not all(isinstance(c, str) for c in crops):
        return jsonify({"error": "'crops' must be a list of strings"}), 400


    valid = [c for c in crops if c in minmax_values.index]


    selected = valid[:count]

    results = []
    for crop in selected:
        params = generate_random_parameters(crop)
        if params:
            results.append({
                "crop": crop,
                "parameters": params
            })
        repo.insert_sensor_reading(crop, params)

    return jsonify({"results": results})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
