"""
NIA 피부 상태 분석 API 서버

MediaPipe Face Mesh로 얼굴 부위를 자동 크롭한 후,
학습된 ResNet50 모델로 피부 상태를 예측하는 FastAPI 서버.

Usage:
    cd c:\\Users\\user\\Documents\\nia
    uvicorn tool.api_server:app --host 0.0.0.0 --port 8000
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import models, transforms
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_server")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
CHECKPOINT_DIR = Path(os.environ.get("CHECKPOINT_DIR", str(BASE_DIR / "checkpoint")))
LANDMARKER_MODEL_PATH = os.environ.get(
    "LANDMARKER_MODEL_PATH",
    str(Path(__file__).resolve().parent / "face_landmarker.task"),
)

# ---------------------------------------------------------------------------
# Model configs (test.py:98-108)
# ---------------------------------------------------------------------------
CLASS_MODEL_CONFIG = {
    "dryness": 5,
    "pigmentation": 6,
    "pore": 6,
    "sagging": 6,
    "wrinkle": 7,
}

REGRESSION_MODEL_CONFIG = {
    "pigmentation": 1,
    "moisture": 1,
    "elasticity_R2": 1,
    "wrinkle_Ra": 1,
    "pore": 1,
}

# ---------------------------------------------------------------------------
# Model → facepart mapping (test.py:144-164)
# ---------------------------------------------------------------------------
CLASS_FACEPART_MAP = {
    "dryness": [(7, "lip")],
    "pigmentation": [(1, "forehead"), (5, "left_cheek"), (6, "right_cheek")],
    "pore": [(5, "left_cheek"), (6, "right_cheek")],
    "sagging": [(8, "chin")],
    "wrinkle": [
        (1, "forehead"),
        (2, "glabellus"),
        (3, "left_perocular"),
        (4, "right_perocular"),
    ],
}

REGRESSION_FACEPART_MAP = {
    "pigmentation": [(0, "full_face")],
    "moisture": [(1, "forehead"), (5, "left_cheek"), (6, "right_cheek"), (8, "chin")],
    "elasticity_R2": [
        (1, "forehead"),
        (5, "left_cheek"),
        (6, "right_cheek"),
        (8, "chin"),
    ],
    "wrinkle_Ra": [(3, "left_perocular"), (4, "right_perocular")],
    "pore": [(5, "left_cheek"), (6, "right_cheek")],
}

# Regression denormalization factors (model.py:634-651)
DENORM_FACTORS = {
    "elasticity_R2": 1,
    "moisture": 100,
    "wrinkle_Ra": 50,
    "pigmentation": 350,
    "pore": 2600,
}

# ---------------------------------------------------------------------------
# MediaPipe landmark indices per facepart
# ---------------------------------------------------------------------------
FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
]

FACEPART_LANDMARKS = {
    # 0: full face — face oval
    0: {"landmarks": FACE_OVAL},
    # 1: forehead — eyebrow top + upper face boundary, extend upward
    1: {
        "landmarks": [
            10, 338, 297, 332, 284, 251, 389, 356,
            109, 67, 103, 54, 21, 162, 127,
            70, 63, 105, 66, 107,
            336, 296, 334, 293, 300,
        ],
        "extend_up": 0.6,
    },
    # 2: glabellus — between eyebrows
    2: {
        "landmarks": [
            9, 151, 8, 168, 6, 197, 195, 5,
            107, 66, 105, 63, 70, 46, 53,
            336, 296, 334, 293, 300, 276, 283,
        ],
    },
    # 3: left perocular — left eye area
    3: {
        "landmarks": [
            33, 7, 163, 144, 145, 153, 154, 155, 133,
            173, 157, 158, 159, 160, 161, 246,
            130, 25, 110, 24, 23, 22, 26, 112,
            243, 190, 56, 28, 27, 29, 30, 247,
        ],
    },
    # 4: right perocular — right eye area
    4: {
        "landmarks": [
            263, 249, 390, 373, 374, 380, 381, 382, 362,
            398, 384, 385, 386, 387, 388, 466,
            359, 255, 339, 254, 253, 252, 256, 341,
            463, 414, 286, 258, 257, 259, 260, 467,
        ],
    },
    # 5: left cheek
    5: {
        "landmarks": [
            36, 205, 206, 187, 123, 116, 117, 118, 119, 120,
            47, 100, 142, 203, 216, 212,
            192, 214, 210, 211, 32, 201, 200, 199, 208,
        ],
    },
    # 6: right cheek
    6: {
        "landmarks": [
            266, 425, 426, 411, 352, 345, 346, 347, 348, 349,
            277, 329, 371, 423, 436, 432,
            416, 434, 430, 431, 262, 421, 420, 419, 428,
        ],
    },
    # 7: lip
    7: {
        "landmarks": [
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291,
            308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78,
            191, 80, 81, 82, 13, 312, 311, 310, 415,
            185, 40, 39, 37, 0, 267, 269, 270, 409,
        ],
    },
    # 8: chin
    8: {
        "landmarks": [
            152, 148, 176, 149, 150, 136, 172, 58,
            377, 400, 378, 379, 365, 397, 288,
            175, 171, 396, 199, 200, 201, 418, 421, 420, 419,
        ],
    },
}

# ---------------------------------------------------------------------------
# Eval transform (data_loader.py:97-192, eval mode)
# ---------------------------------------------------------------------------
eval_transform = transforms.Compose(
    [
        transforms.Resize((256, 256), antialias=True),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
loaded_models: dict[str, dict[str, torch.nn.Module]] = {}
face_landmarker = None  # mp.tasks.vision.FaceLandmarker (loaded at startup)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
def _load_models(config: dict[str, int], mode: str) -> dict[str, torch.nn.Module]:
    result = {}
    for name, num_classes in config.items():
        ckpt_path = (
            CHECKPOINT_DIR / mode / "1st_cnn" / "save_model" / name / "state_dict.bin"
        )
        if not ckpt_path.exists():
            logger.warning("Checkpoint not found: %s", ckpt_path)
            continue

        model = models.resnet50(num_classes=num_classes)
        state_dict = torch.load(str(ckpt_path), map_location=device, weights_only=False)
        model.load_state_dict(state_dict["model_state"], strict=False)
        model.eval()
        model.to(device)
        del state_dict
        result[name] = model
        logger.info("Loaded %s/%s", mode, name)
    return result


def load_all_models() -> dict[str, dict[str, torch.nn.Module]]:
    return {
        "class": _load_models(CLASS_MODEL_CONFIG, "class"),
        "regression": _load_models(REGRESSION_MODEL_CONFIG, "regression"),
    }


# ---------------------------------------------------------------------------
# Face landmark detection & cropping (MediaPipe Tasks API)
# ---------------------------------------------------------------------------
def detect_landmarks(img_rgb: np.ndarray):
    import mediapipe as mp

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    result = face_landmarker.detect(mp_image)
    if not result.face_landmarks:
        return None
    return result.face_landmarks[0]  # list of NormalizedLandmark


def crop_facepart(
    img_rgb: np.ndarray, landmarks: list, facepart_id: int
) -> np.ndarray | None:
    h, w = img_rgb.shape[:2]
    cfg = FACEPART_LANDMARKS[facepart_id]
    lm_indices = cfg["landmarks"]

    xs, ys = [], []
    for idx in lm_indices:
        lm = landmarks[idx]
        xs.append(int(lm.x * w))
        ys.append(int(lm.y * h))

    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)

    # Forehead: extend upward since MediaPipe doesn't reach the hairline
    if "extend_up" in cfg:
        ext = int((y_max - y_min) * cfg["extend_up"])
        y_min = max(0, y_min - ext)

    # Center-based square crop (img_crop.py:33-44)
    cx = (x_min + x_max) // 2
    cy = (y_min + y_max) // 2
    crop_length = max(x_max - x_min, y_max - y_min) // 2
    if crop_length < 5:
        return None

    cropped = img_rgb[
        max(cy - crop_length, 0) : min(cy + crop_length, h),
        max(cx - crop_length, 0) : min(cx + crop_length, w),
    ]
    if cropped.size == 0:
        return None

    return cv2.resize(cropped, (256, 256))


# ---------------------------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------------------------
def preprocess(crop_rgb: np.ndarray) -> torch.Tensor:
    pil = Image.fromarray(crop_rgb.astype(np.uint8))
    tensor = eval_transform(pil).unsqueeze(0)  # (1, 3, 256, 256)
    return tensor.to(device)


# ---------------------------------------------------------------------------
# Inference helpers
# ---------------------------------------------------------------------------
def classify(model: torch.nn.Module, tensor: torch.Tensor) -> dict:
    with torch.no_grad():
        logits = model(tensor)  # (1, num_classes)
    probs = torch.softmax(logits, dim=1)[0]
    grade = int(probs.argmax().item())
    return {
        "grade": grade,
        "probabilities": [round(p, 4) for p in probs.tolist()],
    }


def regress(model: torch.nn.Module, tensor: torch.Tensor, model_name: str) -> dict:
    with torch.no_grad():
        output = model(tensor)  # (1, 1)
    raw = output.item()
    value = round(raw * DENORM_FACTORS[model_name], 3)
    return {"value": value}


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_landmarker
    # Load MediaPipe face landmarker (lazy import to avoid path conflicts)
    import mediapipe as mp

    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=LANDMARKER_MODEL_PATH),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=1,
    )
    face_landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
    logger.info("MediaPipe FaceLandmarker loaded")
    # Load skin condition models
    loaded_models.update(load_all_models())
    total = sum(len(v) for v in loaded_models.values())
    logger.info("Total %d models loaded on %s", total, device)
    yield
    face_landmarker.close()
    loaded_models.clear()


app = FastAPI(title="NIA Skin Condition API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://skin-diagnosis-project.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": str(device),
        "models_loaded": {
            mode: list(m.keys()) for mode, m in loaded_models.items()
        },
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    mode: Literal["class", "regression"] = Form("class"),
):
    # 1. Decode image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="이미지를 디코딩할 수 없습니다.")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # 2. Detect face landmarks
    landmarks = detect_landmarks(img_rgb)
    if landmarks is None:
        raise HTTPException(
            status_code=422,
            detail="얼굴을 감지할 수 없습니다. 정면 얼굴 사진을 사용해 주세요.",
        )

    # 3. Determine which faceparts are needed and crop them (cache to avoid duplicates)
    facepart_map = CLASS_FACEPART_MAP if mode == "class" else REGRESSION_FACEPART_MAP
    model_dict = loaded_models.get(mode, {})

    crop_cache: dict[int, np.ndarray | None] = {}
    needed_ids = set()
    for parts in facepart_map.values():
        for fp_id, _ in parts:
            needed_ids.add(fp_id)

    for fp_id in needed_ids:
        crop_cache[fp_id] = crop_facepart(img_rgb, landmarks, fp_id)

    # 4. Run inference for each model on its required faceparts
    predictions: dict = {}
    warnings: list[str] = []

    for model_name, parts in facepart_map.items():
        model = model_dict.get(model_name)
        if model is None:
            warnings.append(f"{model_name} 모델이 로드되지 않았습니다.")
            continue

        part_results = {}
        for fp_id, area_label in parts:
            crop = crop_cache.get(fp_id)
            if crop is None:
                warnings.append(
                    f"{model_name}/{area_label} 부위를 크롭할 수 없습니다."
                )
                continue

            tensor = preprocess(crop)
            if mode == "class":
                part_results[area_label] = classify(model, tensor)
            else:
                part_results[area_label] = regress(model, tensor, model_name)

        if part_results:
            predictions[model_name] = part_results

    result: dict = {"mode": mode, "predictions": predictions}
    if warnings:
        result["warnings"] = warnings
    return result
