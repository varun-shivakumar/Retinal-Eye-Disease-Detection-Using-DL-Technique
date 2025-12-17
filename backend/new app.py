# app_pytorch_inference.py
import os
import io
import json
import base64
import traceback
from pathlib import Path
from datetime import datetime

from PIL import Image
import numpy as np
import cv2

from flask import Flask, request, jsonify
from flask_cors import CORS

import torch
import torch.nn as nn
from torchvision import transforms, models

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image, preprocess_image

from sqlalchemy import create_engine, text

# ---------------- CONFIG - edit these ----------------
MODEL_PATH = Path(rdatamodelseye_multitask_model_B3.pth)   # path to your saved checkpoint
LOG_DB_PATH = sqlitepredictions_flask.db
IMG_SIZE = 300  # must match training input size
DEVICE = cuda if torch.cuda.is_available() else cpu
# Optional base folder if your manifest paths are relative; not required for inference single images
MANIFEST_BASE_DIR = Path(dataprocessed)  
# ----------------------------------------------------

# Flask app
app = Flask(__name__)
CORS(app, resources={r {origins [httplocalhost3000, http127.0.0.13000]}})

# Database
engine = create_engine(LOG_DB_PATH, echo=False)

# class map (should match training order)
CLASS_MAP_INV = {
    0 Normal,
    1 Cataract,
    2 Diabetic Retinopathy,
    3 Glaucoma
}
NUM_CLASSES = len(CLASS_MAP_INV)

# ---------------- Model definition (must match training) ----------------
class MultiTaskNet(nn.Module)
    def __init__(self, num_classes=4, dropout=0.5)
        super().__init__()
        self.encoder = models.efficientnet_b3(weights=models.EfficientNet_B3_Weights.IMAGENET1K_V1)
        enc_features = self.encoder.classifier[1].in_features
        self.encoder.classifier = nn.Identity()
        self.classifier = nn.Sequential(nn.Dropout(dropout), nn.Linear(enc_features, num_classes))

        # segmentation decoder used in training (transposed conv stack)
        self.seg_head = nn.Sequential(
            nn.ConvTranspose2d(enc_features, 256, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(256, 128, 4, 2, 1), nn.ReLU(),
            nn.ConvTranspose2d(128, 64, 4, 2, 1),  nn.ReLU(),
            nn.ConvTranspose2d(64, 32, 4, 2, 1),   nn.ReLU(),
            nn.ConvTranspose2d(32, 1, 4, 2, 1)  # may produce slightly larger HxW - crop later
        )
        # optional dynamic loss log_vars retained in checkpoint; model should still load if present

    def forward(self, x)
        feats = self.encoder.features(x)      # B x C x Hf x Wf
        pooled = feats.mean(dim=(2,3))       # B x C
        cls_out = self.classifier(pooled)    # B x num_classes
        seg_out = self.seg_head(feats)       # B x 1 x H_out x W_out
        # crop to IMG_SIZE if needed (seg_out could be bigger)
        if seg_out.shape[-1] != IMG_SIZE or seg_out.shape[-2] != IMG_SIZE
            # center crop or resize - choose center crop if slightly larger
            seg_out = torch.nn.functional.interpolate(seg_out, size=(IMG_SIZE, IMG_SIZE), mode='bilinear', align_corners=False)
        return cls_out, seg_out

# ---------------- Globals loaded on first request ----------------
model = None
gradcam = None
classification_wrapper = None

def load_model()
    global model, gradcam, classification_wrapper
    if model is not None
        return

    if not MODEL_PATH.exists()
        raise FileNotFoundError(fModel checkpoint not found {MODEL_PATH})

    print(Loading model from, MODEL_PATH)
    m = MultiTaskNet(num_classes=NUM_CLASSES).to(DEVICE)
    ckpt = torch.load(MODEL_PATH, map_location=DEVICE)

    # saved dict may have key 'model' or 'model_state' or be raw state_dict
    if isinstance(ckpt, dict) and (model in ckpt or model_state in ckpt or model_state_dict in ckpt)
        if model in ckpt
            state = ckpt[model]
        elif model_state in ckpt
            state = ckpt[model_state]
        elif model_state_dict in ckpt
            state = ckpt[model_state_dict]
        else
            # try other likely keys
            keys = list(ckpt.keys())
            state = ckpt.get(keys[0], ckpt)
    else
        state = ckpt

    # load state dict robustly
    try
        m.load_state_dict(state)
    except Exception as e
        # attempt to handle prefix 'module.' from DataParallel
        new_state = {}
        for k,v in state.items()
            nk = k.replace(module., ) if k.startswith(module.) else k
            new_state[nk] = v
        m.load_state_dict(new_state)

    m.eval()
    model = m
    print(Model loaded to, DEVICE)

    # Grad-CAM pick last conv feature map in backbone
    # torchvision EfficientNet features is a nn.Sequential — pick last element
    try
        target_layer = model.encoder.features[-1]
    except Exception
        # fallback find last Conv2d in model
        target_layer = None
        for module in reversed(list(model.modules()))
            if isinstance(module, torch.nn.Conv2d)
                target_layer = module
                break
    if target_layer is None
        raise RuntimeError(Could not find target layer for Grad-CAM)

    # wrapper for classification only (GradCAM expects a classification output)
    class ClassificationOnlyWrapper(nn.Module)
        def __init__(self, full_model)
            super().__init__()
            self.full = full_model
        def forward(self, x)
            cls, _ = self.full(x)
            return cls

    classification_wrapper = ClassificationOnlyWrapper(model).to(DEVICE)
    gradcam = GradCAM(model=classification_wrapper, target_layers=[target_layer], use_cuda=(DEVICE==cuda))

# ---------------- Helpers images, masks, overlays ----------------
preprocess_transform = transforms = transforms = transforms = None
# we'll build transform programmatically below with same normalization used in training
mean = [0.485, 0.456, 0.406]
std  = [0.229, 0.224, 0.225]
def build_preprocess()
    global preprocess_transform
    if preprocess_transform is None
        preprocess_transform = transforms = __import__(torchvision.transforms, fromlist=['transforms']).transforms.Compose([
            __import__(torchvision.transforms, fromlist=['transforms']).transforms.Resize((IMG_SIZE, IMG_SIZE)),
            __import__(torchvision.transforms, fromlist=['transforms']).transforms.ToTensor(),
            __import__(torchvision.transforms, fromlist=['transforms']).transforms.Normalize(mean=mean, std=std)
        ])
    return preprocess_transform

def pil_to_tensor_for_model(pil_img)
    tf = build_preprocess()
    return tf(pil_img).unsqueeze(0).to(DEVICE)

def encode_base64_png_from_pil(pil_img)
    buff = io.BytesIO()
    pil_img.save(buff, format=PNG)
    buff.seek(0)
    return base64.b64encode(buff.read()).decode(utf-8)

def overlay_heatmap_on_pil(pil_rgb, cam_mask, alpha=0.4)
    # pil_rgb  PIL RGB image resized to IMG_SIZE
    rgb = np.array(pil_rgb).astype(np.float32)  255.0
    cam_uint8 = (cam_mask  255).astype(uint8)
    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB).astype(np.float32)255.0
    overlay = (1-alpha)rgb + alphaheatmap
    overlay = np.clip(overlay, 0, 1)
    overlay_img = Image.fromarray((overlay255).astype(uint8))
    return overlay_img

# ---------------- DB utilities ----------------
def init_db()
    with engine.begin() as conn
        conn.execute(text(
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
        ))

# ---------------- Routes ----------------
@app.route(health, methods=[GET])
def health()
    return jsonify({statusok,deviceDEVICE})

@app.route(history, methods=[GET])
def history()
    try
        with engine.connect() as conn
            rows = conn.execute(text(SELECT id, filename, predicted_disease, confidence, probabilities, created_at FROM predictions ORDER BY created_at DESC LIMIT 200)).fetchall()
        out = []
        for r in rows
            out.append({
                id r[0],
                filename r[1],
                predicted_disease r[2],
                confidence float(r[3]),
                probabilities json.loads(r[4]),
                created_at str(r[5])
            })
        return jsonify(out)
    except Exception as e
        return jsonify({error str(e)}), 500

@app.route(predict, methods=[POST])
def predict()
    try
        load_model()
        init_db()
        if image not in request.files
            return jsonify({errorno image file uploaded under key 'image'}), 400
        f = request.files[image]
        if f.filename == 
            return jsonify({errorempty filename}), 400

        # Read PIL image
        pil = Image.open(f.stream).convert(RGB)
        # keep resized RGB for overlay generation
        pil_resized = pil.resize((IMG_SIZE, IMG_SIZE))
        # preprocess for model
        inp_tensor = pil_to_tensor_for_model(pil_resized)  # 1 x C x H x W

        # forward (classification + segmentation)
        with torch.no_grad()
            cls_logits, seg_logits = model(inp_tensor)
            probs = torch.softmax(cls_logits, dim=1).cpu().numpy()[0]
            pred_idx = int(np.argmax(probs))
            pred_label = CLASS_MAP_INV[pred_idx]
            confidence = float(probs[pred_idx])

            # segmentation convert to binary mask (if seg head exists)
            if seg_logits is not None
                seg_np = torch.sigmoid(seg_logits).cpu().numpy()[0,0]
                # seg_np shape HxW (IMG_SIZE)
                mask_uint8 = (seg_np  0.5).astype(uint8)  255
                mask_pil = Image.fromarray(mask_uint8).convert(L).resize((IMG_SIZE, IMG_SIZE))
            else
                mask_pil = Image.fromarray(np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.uint8))

        # Grad-CAM (use classification_wrapper)
        try
            rgb_for_cam = np.array(pil_resized).astype(np.float32)  255.0
            # preprocess_image (pytorch-grad-cam) wants HWC float, but it returns tensor; however we use our wrapper
            input_for_cam = preprocess_image(rgb_for_cam, mean=mean, std=std).to(DEVICE)
            # ensure gradcam wrapper uses the loaded model weights
            # classification_wrapper is already built in load_model()
            grayscale_cam = gradcam(input_for_cam, targets=[ClassifierOutputTarget(pred_idx)])  # shape (1,H,W)
            cam_mask = grayscale_cam[0]
            # cam_mask in [0,1], resize if needed
            if cam_mask.shape != (IMG_SIZE, IMG_SIZE)
                cam_mask = cv2.resize(cam_mask, (IMG_SIZE, IMG_SIZE))
            overlay_pil = overlay_heatmap_on_pil(pil_resized, (cam_mask255).astype(uint8))
        except Exception as e
            print(Grad-CAM error, e)
            overlay_pil = pil_resized

        # encode images as base64
        overlay_b64 = encode_base64_png_from_pil(overlay_pil)
        mask_b64 = encode_base64_png_from_pil(mask_pil.convert(RGB))

        # insert into DB
        probabilities_json = json.dumps({CLASS_MAP_INV[i] float(round(float(probs[i]),4)) for i in range(len(probs))})
        with engine.begin() as conn
            conn.execute(text(INSERT INTO predictions (filename, predicted_disease, confidence, probabilities, heatmap_base64, mask_base64) VALUES (fn,pd,c,p,h,m)),
                         {fn f.filename, pd pred_label, c confidence, p probabilities_json, h overlay_b64, m mask_b64})

        # return JSON
        return jsonify({
            predicted_disease pred_label,
            confidence confidence,
            probabilities json.loads(probabilities_json),
            heatmap_png_base64 overlay_b64,
            mask_png_base64 mask_b64
        })

    except Exception as e
        traceback.print_exc()
        return jsonify({error str(e)}), 500

if __name__ == __main__
    print(Starting Flask server on 0.0.0.08000)
    init_db()
    load_model()
    app.run(host=0.0.0.0, port=8000, debug=False)
