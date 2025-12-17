import os
import json
import base64
import io
import numpy as np
import cv2
import traceback
from sqlalchemy import create_engine, text
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:8080", "http://127.0.0.1:8080"
]}})

# Paths
MODEL_PATH = os.path.join("models", "densenet_best_.keras")
CLASS_NAMES_PATH = os.path.join("models", "class_names.json")
UPLOAD_FOLDER = "uploads"
HEATMAP_FOLDER = "static_heatmaps"
LAST_CONV_LAYER_NAME = "conv5_block16_concat"
IMG_SIZE = (224, 224)
SCALE_INPUT = True

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(HEATMAP_FOLDER, exist_ok=True)

# DB connection
engine = create_engine("sqlite:///predictions.db", echo=False)

# Globals
model = None
labs = None


def load_model_and_labels():
    global model, labs
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Model not found at " + MODEL_PATH)
        model = load_model(MODEL_PATH,compile=False)

    if labs is None:
        with open(CLASS_NAMES_PATH, "r") as f:
            labs = json.load(f)


def preprocess_image(file_storage):
    image = Image.open(file_storage.stream).convert("RGB")
    image = image.resize(IMG_SIZE)
    arr = np.array(image).astype(np.float32)
    if SCALE_INPUT:
        arr = arr / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr, image


def get_gradcam_heatmap(img_array, model, last_conv_layer_name=LAST_CONV_LAYER_NAME):
    last_conv_layer = model.get_layer(last_conv_layer_name)
    grad_model = tf.keras.models.Model(model.inputs, [last_conv_layer.output, model.output])

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array, training=False)
        pred_index = tf.argmax(predictions[0])
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def overlay_heatmap_on_image(heatmap_np, pil_image, alpha=0.4):
    rgb = np.array(pil_image)
    heatmap_resized = cv2.resize(heatmap_np, (rgb.shape[1], rgb.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_color_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_color_rgb = cv2.cvtColor(heatmap_color_bgr, cv2.COLOR_BGR2RGB)
    overlay_rgb = cv2.addWeighted(rgb, 1.0 - alpha, heatmap_color_rgb, alpha, 0)
    return overlay_rgb


def encode_rgb_png_base64(rgb_array):
    img_pil = Image.fromarray(rgb_array)
    buf = io.BytesIO()
    img_pil.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/history")
def get_history():
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT id, predicted_disease, confidence, probabilities, timestamp "
                "FROM predictions ORDER BY timestamp DESC"
            )).mappings()

        history = []
        for row in result:
            history.append({
                "id": row["id"],
                "predicted_disease": row["predicted_disease"],
                "confidence": row["confidence"],
                "probabilities": row["probabilities"],
                "timestamp": row["timestamp"]   # ✅ FIXED (was created_at)
            })

        return jsonify(history)
    except Exception as e:
        print("🔥 ERROR in /history:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.post("/predict")
def predict():
    try:
        global model, labs

        if model is None or labs is None:
            load_model_and_labels()

        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        print("✅ File received:", file.filename)

        # Preprocess
        img_array, pil_image = preprocess_image(file)

        # Predict
        preds = model.predict(img_array)
        probs = preds.flatten().astype(float)
        pred_idx = int(np.argmax(probs))
        disease = labs[pred_idx]
        confidence = float(probs[pred_idx])

        # Probability dict
        probabilities = {labs[i]: float(np.round(probs[i], 3)) for i in range(len(labs))}

        # Grad-CAM
        heatmap_np = get_gradcam_heatmap(img_array, model, LAST_CONV_LAYER_NAME)
        overlay_rgb = overlay_heatmap_on_image(heatmap_np, pil_image, alpha=0.4)
        heatmap_png_base64 = encode_rgb_png_base64(overlay_rgb)

        # ✅ Ensure table exists
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    predicted_disease TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    probabilities TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # ✅ Insert row
            conn.execute(
                text("INSERT INTO predictions (predicted_disease, confidence, probabilities) "
                     "VALUES (:d, :c, :p)"),
                {"d": disease, "c": confidence, "p": json.dumps(probabilities)}
            )

        return jsonify({
            "predicted_disease": disease,
            "confidence": confidence,
            "probabilities": probabilities,
            "heatmap_png_base64": heatmap_png_base64
        }), 200

    except Exception as e:
        print("❌ ERROR in /predict:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
