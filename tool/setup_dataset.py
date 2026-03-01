"""
AI-Hub 원본 데이터를 프로젝트 구조에 맞게 정리하는 스크립트.

zip 파일 4개(Training/Validation x 원천/라벨링)를 추출하여
dataset/img/, dataset/label/ 폴더로 병합 배치합니다.
디렉토리명을 '1. 디지털카메라' → '01' 등으로 변환합니다.
"""

import os
import zipfile
import shutil
from pathlib import Path

# 경로 설정
DATA_ROOT = r"C:\Users\user\Documents\028.한국인 피부상태 측정 데이터\3.개방데이터\1.데이터"
PROJECT_ROOT = r"C:\Users\user\Documents\nia"
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")

# zip 파일 목록: (zip경로, 대상폴더)
ZIP_FILES = [
    (os.path.join(DATA_ROOT, "Training", "01.원천데이터", "TS.zip"), "img"),
    (os.path.join(DATA_ROOT, "Validation", "01.원천데이터", "VS.zip"), "img"),
    (os.path.join(DATA_ROOT, "Training", "02.라벨링데이터", "TL.zip"), "label"),
    (os.path.join(DATA_ROOT, "Validation", "02.라벨링데이터", "VL.zip"), "label"),
]

# 디렉토리 접두사 → 장비 코드 매핑
DEVICE_MAP = {
    "1": "01",  # 디지털카메라
    "2": "02",  # 스마트패드
    "3": "03",  # 스마트폰
}


def extract_and_organize(zip_path, target_subdir):
    """zip을 추출하여 dataset/{target_subdir}/ 아래에 정리"""
    target_dir = os.path.join(DATASET_DIR, target_subdir)
    os.makedirs(target_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"추출 중: {os.path.basename(zip_path)} → dataset/{target_subdir}/")
    print(f"{'='*60}")

    with zipfile.ZipFile(zip_path, "r") as z:
        entries = z.namelist()
        total = sum(1 for e in entries if not e.endswith("/"))
        done = 0

        for entry in entries:
            if entry.endswith("/"):
                continue

            parts = entry.split("/")
            if len(parts) < 3:
                continue

            # 첫 번째 디렉토리의 접두사 숫자로 장비 코드 결정
            top_dir = parts[0]
            device_prefix = top_dir[0]
            device_code = DEVICE_MAP.get(device_prefix)

            if device_code is None:
                print(f"  건너뜀 (알 수 없는 장비): {entry}")
                continue

            # parts[1] = 피험자 ID (예: 0002)
            # parts[2] = 파일명 (예: 0002_01_F.jpg)
            subject_id = parts[1]
            filename = parts[2]

            out_dir = os.path.join(target_dir, device_code, subject_id)
            os.makedirs(out_dir, exist_ok=True)

            out_path = os.path.join(out_dir, filename)
            if not os.path.exists(out_path):
                with z.open(entry) as src, open(out_path, "wb") as dst:
                    shutil.copyfileobj(src, dst)

            done += 1
            if done % 1000 == 0 or done == total:
                print(f"  진행: {done}/{total} ({done*100//total}%)")

    print(f"  완료: {done}개 파일 추출")


def main():
    print("AI-Hub 데이터 정리 스크립트")
    print(f"원본 데이터: {DATA_ROOT}")
    print(f"대상 폴더: {DATASET_DIR}")

    # zip 파일 존재 확인
    for zip_path, _ in ZIP_FILES:
        if not os.path.isfile(zip_path):
            print(f"오류: {zip_path} 파일을 찾을 수 없습니다.")
            return

    for zip_path, target_subdir in ZIP_FILES:
        extract_and_organize(zip_path, target_subdir)

    # 결과 확인
    print(f"\n{'='*60}")
    print("정리 완료! 결과:")
    print(f"{'='*60}")
    for subdir in ["img", "label"]:
        path = os.path.join(DATASET_DIR, subdir)
        if os.path.isdir(path):
            for device in sorted(os.listdir(path)):
                device_path = os.path.join(path, device)
                if os.path.isdir(device_path):
                    subjects = len(os.listdir(device_path))
                    print(f"  dataset/{subdir}/{device}/ → 피험자 {subjects}명")


if __name__ == "__main__":
    main()
