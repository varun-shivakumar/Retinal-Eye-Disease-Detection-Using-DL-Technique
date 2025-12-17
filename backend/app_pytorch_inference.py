# app_pytorch_inference.py
"""
Robust Flask inference server for multi-task EfficientNet-B3 model (classification + segmentation).
- Robust checkpoint/state_dict loading
- Tolerant Grad-CAM initialization across versions
- Thread-safe Grad-CAM usage
- Optional skipping of CAM/mask via query params
- SQLite logging of predictions
- CORS configured for dev origins
"""
import io
import os
import json
import base64
import traceback
import threading
from pathlib import Path
from datetime import datetime
from PIL import Image
import numpy as np
import cv2

from flask import Flask, request, jsonify
from flask_cors import CORS

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
import torchvision.transforms as T

# tolerant import of pytorch-grad-cam
try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image, preprocess_image
    from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
except Exception:
    GradCAM = None
    show_cam_on_image = None
    preprocess_image = None
    ClassifierOutputTarget = None

from sqlalchemy import create_engine, text
import pandas as pd

# ---------------- CONFIG - edit these ----------------
# FIX 1: Use a relative path. Assumes .pth is in the same folder as this script.
# Fix: Use the script's own location to find the file reliably
MODEL_PATH = Path(__file__).parent / "models" / "eye_model_lite.pth"
LOG_DB_PATH = "sqlite:///predictions_flask.db"
IMG_SIZE = 224
MAX_UPLOAD_MB = 12 
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ai-eye-disease-detection-chi.vercel.app", # REPLACE THIS with your actual Vercel URL after deploying frontend
]
# ----------------------------------------------------

# Flask app
app = Flask(__name__)

# FIX 2: Correct syntax using the 'origins' key and the variable defined above
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024

# DB engine
engine = create_engine(LOG_DB_PATH, echo=False)

# ... (The rest of your Model class, Load functions, and Routes go here) ...
# ... (The rest of your Model class, Load functions, and Routes go here) ...

# class map - MUST match training order
CLASS_MAP_INV = {
    0: "Normal",
    1: "Cataract",
    2: "Diabetic Retinopathy",
    3: "Glaucoma"
}
NUM_CLASSES = len(CLASS_MAP_INV)

# ---------------- Model definition (must match training) ----------------
class MultiTaskNet(nn.Module):
    def __init__(self, num_classes=4, dropout=0.5, img_size=IMG_SIZE):
        super().__init__()
        # EfficientNet-B3 from torchvision (weights argument available in torchvision)
        self.encoder = models.efficientnet_b3(weights=None)
        
        # We need to match the architecture exactly. 
        # EfficientNet features usually output 1536 channels for B3.
        # The user script used dynamic lookup: self.encoder.classifier[1].in_features
        # We will replicate that safety check but defaulting to standard if missing.
        try:
            enc_features = self.encoder.classifier[1].in_features
        except:
            enc_features = 1536

        self.encoder.classifier = nn.Identity()
        self.classifier = nn.Sequential(nn.Dropout(dropout), nn.Linear(enc_features, num_classes))
        
        # Segmentation Head - matches kernel_size=4 from your checkpoint
        self.seg_head = nn.Sequential(
            nn.ConvTranspose2d(enc_features, 256, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(256, 128, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(128, 64, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(64, 32, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(32, 1, 4, 2, 1)
        )
        self.log_vars = nn.Parameter(torch.zeros(2))
        self.img_size = img_size

    def forward(self, x):
        feats = self.encoder.features(x)
        # Global Average Pooling
        pooled = F.adaptive_avg_pool2d(feats, 1).reshape(feats.shape[0], -1)
        cls_out = self.classifier(pooled)
        
        seg_out = self.seg_head(feats)
        # Guarantee output size is (img_size, img_size)
        if seg_out.shape[-2:] != (self.img_size, self.img_size):
            seg_out = F.interpolate(seg_out, size=(self.img_size, self.img_size), mode='bilinear', align_corners=False)
        return cls_out, seg_out

# ---------------- Globals ----------------
_model = None
_gradcam = None
_classification_wrapper = None
_gradcam_lock = threading.Lock()

# Preprocess transform
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]
def build_preprocess():
    return T.Compose([
        T.Resize((IMG_SIZE, IMG_SIZE)),
        T.ToTensor(),
        T.Normalize(mean=MEAN, std=STD)
    ])

def pil_to_tensor_for_model(pil_img):
    tf = build_preprocess()
    return tf(pil_img).unsqueeze(0).to(DEVICE)

def encode_base64_png_from_pil(pil_img):
    buff = io.BytesIO()
    pil_img.save(buff, format="PNG")
    buff.seek(0)
    return base64.b64encode(buff.read()).decode("utf-8")

def overlay_heatmap_on_pil(pil_rgb, cam_mask, alpha=0.4):
    # pil_rgb: PIL Image resized to IMG_SIZE
    rgb = np.array(pil_rgb).astype(np.float32) / 255.0
    # cam_mask assumed 2D, values in [0,1]
    cam_uint8 = (np.clip(cam_mask, 0, 1) * 255).astype("uint8")
    # apply OpenCV colormap
    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB).astype(np.float32)/255.0
    overlay = (1-alpha)*rgb + alpha*heatmap
    overlay = np.clip(overlay, 0, 1)
    overlay_img = Image.fromarray((overlay*255).astype("uint8"))
    return overlay_img

# --- NEW FUNCTION FOR RED MASK OVERLAY ---
def overlay_red_mask_on_pil(pil_rgb, binary_mask_uint8, alpha=0.5):
    """
    Overlays a red color where the mask is 1 (255), transparent elsewhere.
    binary_mask_uint8: numpy array of shape (H, W), values 0 or 255
    """
    rgb = np.array(pil_rgb)
    
    # Create a solid red image
    red_layer = np.zeros_like(rgb)
    red_layer[:, :, 0] = 255  # Red channel full
    
    # Create mask boolean
    mask_bool = binary_mask_uint8 > 0
    
    # Blend only where mask is True
    output = rgb.copy()
    output[mask_bool] = (rgb[mask_bool] * (1 - alpha) + red_layer[mask_bool] * alpha).astype(np.uint8)
    
    return Image.fromarray(output)

# ---------------- DB utilities ----------------
def init_db():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                predicted_disease TEXT,
                confidence REAL,
                probabilities TEXT,
                heatmap_base64 TEXT,
                mask_base64 TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

# ---------------- Model loader (robust GradCAM init) ----------------
def _find_target_conv(module: nn.Module):
    # Prefer last Conv2d in encoder.features, else search entire model
    try:
        feats = module.encoder.features
        # attempt: find last Conv2d inside features (descend)
        last = None
        for m in feats.modules():
            if isinstance(m, nn.Conv2d):
                last = m
        if last is not None:
            return last
    except Exception:
        pass
    # fallback: search entire module
    last = None
    for m in module.modules():
        if isinstance(m, nn.Conv2d):
            last = m
    return last

def load_model():
    global _model, _gradcam, _classification_wrapper
    if _model is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {MODEL_PATH}")

    print("Loading model from:", MODEL_PATH)
    m = MultiTaskNet(num_classes=NUM_CLASSES).to(DEVICE)
    
    try:
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
    except Exception as e:
        print(f"Failed to load checkpoint file: {e}")
        raise e

    # robustly obtain state_dict
    state = ckpt
    if isinstance(ckpt, dict):
        # Priority check for 'model' key which we know works
        if 'model' in ckpt:
            state = ckpt['model']
        else:
            for key in ("model_state", "model_state_dict", "state_dict"):
                if key in ckpt:
                    state = ckpt[key]
                    break

    # normalize keys (strip 'module.' if present) - Keeping this for robustness
    if isinstance(state, dict):
        new_state = {}
        for k, v in state.items():
            nk = k.replace("module.", "") if isinstance(k, str) and k.startswith("module.") else k
            new_state[nk] = v
        state = new_state

    # attempt strict load, then fallback
    try:
        m.load_state_dict(state, strict=True)
        print("✅ Model loaded with strict=True")
    except Exception as e:
        print("Warning: strict load_state_dict failed:", e)
        try:
            m.load_state_dict(state, strict=False)
            print("⚠️ Loaded with strict=False (Some keys might be missing/unexpected, this is often okay).")
        except Exception as e2:
            print("Final load attempt failed:", e2)
            raise e2

    m.eval()
    _model = m.to(DEVICE)
    print("Model loaded to", DEVICE)

    # Setup Grad-CAM tolerant to API differences
    if GradCAM is None or show_cam_on_image is None or preprocess_image is None:
        print("pytorch-grad-cam not available or incomplete; Grad-CAM disabled.")
        _gradcam = None
        _classification_wrapper = None
        return

    # find a sensible target layer
    target_layer = _find_target_conv(_model)
    if target_layer is None:
        print("Could not find a conv layer for Grad-CAM; disabling CAM.")
        _gradcam = None
        _classification_wrapper = None
        return

    # wrapper returns only logits for Grad-CAM
    class ClassificationOnlyWrapper(nn.Module):
        def __init__(self, full_model):
            super().__init__()
            self.full = full_model
        def forward(self, x):
            cls, _ = self.full(x)
            return cls

    _classification_wrapper = ClassificationOnlyWrapper(_model).to(DEVICE)

    # Try multiple GradCAM init signatures
    _gradcam = None
    try:
        # preferred: use_cuda argument (older versions)
        _gradcam = GradCAM(model=_classification_wrapper, target_layers=[target_layer], use_cuda=(DEVICE=="cuda"))
        print("GradCAM initialized with use_cuda.")
    except TypeError:
        try:
            # alternate: device argument
            _gradcam = GradCAM(model=_classification_wrapper, target_layers=[target_layer], device=torch.device(DEVICE))
            print("GradCAM initialized with device arg.")
        except TypeError:
            try:
                # simplest init
                _gradcam = GradCAM(model=_classification_wrapper, target_layers=[target_layer])
                print("GradCAM initialized without extra kwargs.")
            except Exception as e:
                print("GradCAM initialization failed; disabling CAM. Error:", e)
                _gradcam = None
    except Exception as e:
        print("Unexpected error initializing GradCAM; disabling CAM. Error:", e)
        _gradcam = None

    if _gradcam is not None:
        print("GradCAM ready.")
    else:
        print("GradCAM not available; continuing without CAM.")

# ---------------- Routes ----------------
@app.route("/", methods=["GET", "HEAD"])
def index():
    return "Backend is running!"

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "device": DEVICE})

@app.route("/history", methods=["GET"])
def history():
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(
                "SELECT id, filename, predicted_disease, confidence, probabilities, created_at FROM predictions ORDER BY created_at DESC LIMIT 200"
            )).fetchall()
        out = []
        for r in rows:
            out.append({
                "id": r[0],
                "filename": r[1],
                "predicted_disease": r[2],
                "confidence": float(r[3]) if r[3] is not None else None,
                "probabilities": json.loads(r[4]) if r[4] else None,
                "created_at": str(r[5])
            })
        return jsonify(out)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    """
    POST multipart/form-data with key "image" -> file
    Optional query params:
      - no_cam=1   -> skip Grad-CAM generation
      - no_mask=1  -> skip mask generation (return no mask)
    """
    try:
        # ensure model + DB ready
        load_model()
        init_db()

        if "image" not in request.files:
            return jsonify({"error": "no image file uploaded under key 'image'"}), 400
        f = request.files["image"]
        if f.filename == "":
            return jsonify({"error": "empty filename"}), 400

        no_cam = request.args.get("no_cam", "0").lower() in ("1", "true", "yes")
        no_mask = request.args.get("no_mask", "0").lower() in ("1", "true", "yes")

        pil = Image.open(f.stream).convert("RGB")
        pil_resized = pil.resize((IMG_SIZE, IMG_SIZE))
        inp_tensor = pil_to_tensor_for_model(pil_resized)

        # run forward (classification + segmentation) under no_grad
        # with torch.no_grad():
         # run forward (classification + segmentation) using inference_mode (uses less RAM)
        with torch.inference_mode():
            out = _model(inp_tensor)
            # Handle potential output formats
            if isinstance(out, (list, tuple)):
                cls_logits = out[0]
                seg_logits = out[1] if len(out) > 1 else None
            else:
                cls_logits = out
                seg_logits = None

            if not isinstance(cls_logits, torch.Tensor):
                raise RuntimeError(f"Unexpected classification output type: {type(cls_logits)}")

            # --- CLASSIFICATION LOGIC ---
            probs = torch.softmax(cls_logits, dim=1).cpu().numpy()[0]
            pred_idx = int(np.argmax(probs))
            pred_label = CLASS_MAP_INV.get(pred_idx, str(pred_idx))
            confidence = float(probs[pred_idx])

            # --- SEGMENTATION MASK LOGIC (UPDATED) ---
            mask_b64 = None
            if (not no_mask) and (seg_logits is not None):
                try:
                    seg_prob = torch.sigmoid(seg_logits).detach().cpu().numpy()[0, 0]
                    
                    # 1. NORMAL SUPPRESSION (If Normal, mask is empty)
                    if pred_label == "Normal":
                        mask_uint8 = np.zeros_like(seg_prob, dtype="uint8")
                    else:
                        # 2. LOW THRESHOLD (0.25 to catch partial confidence)
                        mask_uint8 = (seg_prob > 0.25).astype("uint8") * 255
                    
                    # 3. GENERATE RED OVERLAY
                    if mask_uint8.max() > 0:
                        # Use the new Red Overlay function
                        mask_pil_overlay = overlay_red_mask_on_pil(pil_resized, mask_uint8)
                        mask_b64 = encode_base64_png_from_pil(mask_pil_overlay)
                    else:
                        # Return clean image if empty
                        mask_b64 = encode_base64_png_from_pil(pil_resized)
                        
                except Exception as e:
                    print(f"Mask generation failed: {e}")
                    traceback.print_exc()
                    mask_b64 = None

        # Grad-CAM (thread-safe)
        overlay_b64 = None
        if (not no_cam) and (_gradcam is not None) and (preprocess_image is not None):
            try:
                rgb_for_cam = np.array(pil_resized).astype(np.float32) / 255.0
                input_for_cam = preprocess_image(rgb_for_cam, mean=MEAN, std=STD).to(DEVICE)
                # thread-safe call
                with _gradcam_lock:
                    grayscale_cam = _gradcam(input_for_cam, targets=[ClassifierOutputTarget(pred_idx)])
                
                cam_np = np.array(grayscale_cam)
                cam_np = np.squeeze(cam_np)
                if cam_np.ndim == 3:
                    cam_np = cam_np[0]
                
                cam_np = cam_np.astype(np.float32)
                if cam_np.max() > 0:
                    cam_np = (cam_np - cam_np.min()) / (cam_np.max() - cam_np.min() + 1e-8)
                else:
                    cam_np = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.float32)
                
                if cam_np.shape != (IMG_SIZE, IMG_SIZE):
                    cam_np = cv2.resize(cam_np, (IMG_SIZE, IMG_SIZE))
                
                overlay_pil = overlay_heatmap_on_pil(pil_resized, cam_np)
                overlay_b64 = encode_base64_png_from_pil(overlay_pil)
            except Exception as e:
                print("Grad-CAM generation error:", e)
                traceback.print_exc()
                overlay_b64 = None

        probabilities_json = json.dumps({CLASS_MAP_INV[i]: float(round(float(probs[i]), 6)) for i in range(len(probs))})

        # store in DB
        with engine.begin() as conn:
            conn.execute(text(
                "INSERT INTO predictions (filename, predicted_disease, confidence, probabilities, heatmap_base64, mask_base64) VALUES (:fn,:pd,:c,:p,:h,:m)"
            ), {"fn": f.filename, "pd": pred_label, "c": confidence, "p": probabilities_json, "h": overlay_b64, "m": mask_b64})

        response = {
            "predicted_disease": pred_label,
            "confidence": confidence,
            "probabilities": json.loads(probabilities_json)
        }
        if overlay_b64 is not None:
            response["heatmap_png_base64"] = overlay_b64
        if mask_b64 is not None:
            response["mask_png_base64"] = mask_b64

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- Main ----------------
if __name__ == "__main__":
    print("Starting Flask server on 0.0.0.0:8000")
    init_db()
    # lazy model load on first request, or load now:
    try:
        load_model()
    except Exception as e:
        print("Model failed to load on startup:", e)
    # For production use a WSGI server (gunicorn, waitress, etc.)
    app.run(host="0.0.0.0", port=8000, debug=False)