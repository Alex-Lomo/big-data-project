import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder



df = pd.read_csv("crops.csv", sep=';')

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
