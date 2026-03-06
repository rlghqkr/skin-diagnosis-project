"""Seed script: insert 120 sample platform products (4 platforms × 30 each).

Usage:
    cd backend && python -m scripts.seed_platform_products
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal, engine
from app.models import Base
from app.models.product import Product
from app.services.statistics_service import INGREDIENT_EFFECT_MAP


def _derive_skin_targets(key_ingredients: list[str]) -> list[str]:
    """Derive skin_targets from key_ingredients using INGREDIENT_EFFECT_MAP."""
    targets = set()
    for ingredient in key_ingredients:
        effects = INGREDIENT_EFFECT_MAP.get(ingredient, {})
        for metric, weight in effects.items():
            if weight >= 0.5:
                targets.add(metric)
    return sorted(targets)


# fmt: off
PRODUCTS = [
    # ── 올리브영 (oliveyoung) ──
    {"platform": "oliveyoung", "rank": 1, "brand": "라운드랩", "name": "독도 토너", "category": "toner", "price": 18000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=독도토너"},
    {"platform": "oliveyoung", "rank": 2, "brand": "토리든", "name": "다이브인 세럼", "category": "serum", "price": 21000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=다이브인"},
    {"platform": "oliveyoung", "rank": 3, "brand": "이니스프리", "name": "그린티 씨드 세럼", "category": "serum", "price": 27000, "key_ingredients": ["Green Tea Seed Oil", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=그린티씨드"},
    {"platform": "oliveyoung", "rank": 4, "brand": "COSRX", "name": "어드밴스드 스네일 에센스", "category": "essence", "price": 15000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=스네일에센스"},
    {"platform": "oliveyoung", "rank": 5, "brand": "메디힐", "name": "N.M.F 아쿠아링 앰플", "category": "ampoule", "price": 22000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=NMF앰플"},
    {"platform": "oliveyoung", "rank": 6, "brand": "닥터지", "name": "레드 블레미쉬 클리어 크림", "category": "cream", "price": 19000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=레드블레미쉬"},
    {"platform": "oliveyoung", "rank": 7, "brand": "아누아", "name": "어성초 토너", "category": "toner", "price": 20000, "key_ingredients": ["Niacinamide", "AHA"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=어성초토너"},
    {"platform": "oliveyoung", "rank": 8, "brand": "에스트라", "name": "아토배리어 크림", "category": "cream", "price": 25000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=아토배리어"},
    {"platform": "oliveyoung", "rank": 9, "brand": "넘버즈인", "name": "3번 비타민C 세럼", "category": "serum", "price": 18000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=3번세럼"},
    {"platform": "oliveyoung", "rank": 10, "brand": "스킨푸드", "name": "로열허니 에센스", "category": "essence", "price": 16000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=로열허니"},
    {"platform": "oliveyoung", "rank": 11, "brand": "VT", "name": "리들샷 부스팅 세럼", "category": "serum", "price": 23000, "key_ingredients": ["Niacinamide", "Peptide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=리들샷"},
    {"platform": "oliveyoung", "rank": 12, "brand": "마녀공장", "name": "퓨어 클렌징 오일", "category": "cleanser", "price": 17000, "key_ingredients": ["Green Tea Seed Oil"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=클렌징오일"},
    {"platform": "oliveyoung", "rank": 13, "brand": "아이소이", "name": "불가리안 로즈 세럼", "category": "serum", "price": 35000, "key_ingredients": ["Vitamin C", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=로즈세럼"},
    {"platform": "oliveyoung", "rank": 14, "brand": "구달", "name": "청귤 비타C 세럼", "category": "serum", "price": 19000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=청귤비타C"},
    {"platform": "oliveyoung", "rank": 15, "brand": "바이오더마", "name": "센시비오 토너", "category": "toner", "price": 22000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=센시비오"},
    {"platform": "oliveyoung", "rank": 16, "brand": "AHC", "name": "바이탈 골든 콜라겐 크림", "category": "cream", "price": 28000, "key_ingredients": ["Peptide", "Retinol"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=골든콜라겐"},
    {"platform": "oliveyoung", "rank": 17, "brand": "미샤", "name": "타임레볼루션 에센스", "category": "essence", "price": 15000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=타임에센스"},
    {"platform": "oliveyoung", "rank": 18, "brand": "헤라", "name": "블랙쿠션", "category": "other", "price": 45000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=블랙쿠션"},
    {"platform": "oliveyoung", "rank": 19, "brand": "달바", "name": "화이트 트러플 세럼", "category": "serum", "price": 29000, "key_ingredients": ["Niacinamide", "Peptide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=트러플세럼"},
    {"platform": "oliveyoung", "rank": 20, "brand": "라네즈", "name": "워터뱅크 크림", "category": "cream", "price": 32000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=워터뱅크"},
    {"platform": "oliveyoung", "rank": 21, "brand": "셀퓨전씨", "name": "레이저 선크림", "category": "sunscreen", "price": 18000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=레이저선크림"},
    {"platform": "oliveyoung", "rank": 22, "brand": "클레어스", "name": "비타민 드롭", "category": "serum", "price": 16000, "key_ingredients": ["Vitamin C"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=비타민드롭"},
    {"platform": "oliveyoung", "rank": 23, "brand": "에뛰드", "name": "순정 마스크 팩", "category": "mask", "price": 2000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=순정마스크"},
    {"platform": "oliveyoung", "rank": 24, "brand": "COSRX", "name": "AHA/BHA 토너", "category": "toner", "price": 12000, "key_ingredients": ["AHA", "Salicylic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=AHA토너"},
    {"platform": "oliveyoung", "rank": 25, "brand": "이즈앤트리", "name": "히알루로닉 토너", "category": "toner", "price": 14000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=히알루로닉"},
    {"platform": "oliveyoung", "rank": 26, "brand": "바닐라코", "name": "클린잇제로", "category": "cleanser", "price": 19000, "key_ingredients": ["Ceramide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=클린잇제로"},
    {"platform": "oliveyoung", "rank": 27, "brand": "일리윤", "name": "세라마이드 크림", "category": "cream", "price": 16000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=세라마이드"},
    {"platform": "oliveyoung", "rank": 28, "brand": "에스트라", "name": "테라사이클 시카 세럼", "category": "serum", "price": 22000, "key_ingredients": ["Niacinamide", "Ceramide"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=시카세럼"},
    {"platform": "oliveyoung", "rank": 29, "brand": "하다라보", "name": "고쿠준 로션", "category": "toner", "price": 13000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=고쿠준"},
    {"platform": "oliveyoung", "rank": 30, "brand": "브링그린", "name": "티트리 세럼", "category": "serum", "price": 15000, "key_ingredients": ["Niacinamide", "Salicylic Acid"], "image_url": "https://placehold.co/300x300/e8f5e9/2DB400?text=티트리세럼"},

    # ── 화해 (hwahae) ──
    {"platform": "hwahae", "rank": 1, "brand": "스킨1004", "name": "마다가스카르 센텔라 앰플", "category": "ampoule", "price": 18000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=센텔라앰플"},
    {"platform": "hwahae", "rank": 2, "brand": "비플레인", "name": "녹두 클렌저", "category": "cleanser", "price": 16000, "key_ingredients": ["Green Tea Seed Oil"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=녹두클렌저"},
    {"platform": "hwahae", "rank": 3, "brand": "아이소이", "name": "액티 히알루론 크림", "category": "cream", "price": 38000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=히알루론크림"},
    {"platform": "hwahae", "rank": 4, "brand": "코스알엑스", "name": "풀핏 프로폴리스 세럼", "category": "serum", "price": 20000, "key_ingredients": ["Niacinamide", "Vitamin C"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=프로폴리스"},
    {"platform": "hwahae", "rank": 5, "brand": "넘버즈인", "name": "5번 스쿠알란 세럼", "category": "serum", "price": 18000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=5번세럼"},
    {"platform": "hwahae", "rank": 6, "brand": "에스트라", "name": "더마UV365 선크림", "category": "sunscreen", "price": 25000, "key_ingredients": ["Niacinamide", "Ceramide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=더마UV365"},
    {"platform": "hwahae", "rank": 7, "brand": "파파레서피", "name": "봄비 꿀 마스크", "category": "mask", "price": 3000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=봄비마스크"},
    {"platform": "hwahae", "rank": 8, "brand": "메디큐브", "name": "제로모공패드", "category": "toner", "price": 24000, "key_ingredients": ["AHA", "Salicylic Acid", "Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=제로모공"},
    {"platform": "hwahae", "rank": 9, "brand": "레티놀시카", "name": "리페어 세럼", "category": "serum", "price": 28000, "key_ingredients": ["Retinol", "Peptide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=레티놀세럼"},
    {"platform": "hwahae", "rank": 10, "brand": "마녀공장", "name": "갈락 나이아신 에센스", "category": "essence", "price": 20000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=갈락에센스"},
    {"platform": "hwahae", "rank": 11, "brand": "셀리맥스", "name": "나이아신 앰플", "category": "ampoule", "price": 22000, "key_ingredients": ["Niacinamide", "Peptide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=나이아신앰플"},
    {"platform": "hwahae", "rank": 12, "brand": "라운드랩", "name": "자작나무 수분 크림", "category": "cream", "price": 20000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=자작나무크림"},
    {"platform": "hwahae", "rank": 13, "brand": "오쏘몰", "name": "비타민C 세럼", "category": "serum", "price": 32000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=비타민C세럼"},
    {"platform": "hwahae", "rank": 14, "brand": "토니모리", "name": "세라마이드 토너", "category": "toner", "price": 15000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=세라토너"},
    {"platform": "hwahae", "rank": 15, "brand": "바이오힐보", "name": "판테놀 크림", "category": "cream", "price": 21000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=판테놀크림"},
    {"platform": "hwahae", "rank": 16, "brand": "듀이트리", "name": "시카 AHA 토너", "category": "toner", "price": 17000, "key_ingredients": ["AHA", "Glycolic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=시카AHA"},
    {"platform": "hwahae", "rank": 17, "brand": "클리오", "name": "구달 비타C 세럼", "category": "serum", "price": 19000, "key_ingredients": ["Vitamin C"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=구달비타C"},
    {"platform": "hwahae", "rank": 18, "brand": "한율", "name": "달빛유자 수면팩", "category": "mask", "price": 25000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=달빛유자"},
    {"platform": "hwahae", "rank": 19, "brand": "포렌코스", "name": "히알루론 토너", "category": "toner", "price": 12000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=히알루론토너"},
    {"platform": "hwahae", "rank": 20, "brand": "웰라쥬", "name": "리얼 히알루로닉 블루 앰플", "category": "ampoule", "price": 16000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=블루앰플"},
    {"platform": "hwahae", "rank": 21, "brand": "에뛰드", "name": "더블래스팅 쿠션", "category": "other", "price": 18000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=더블래스팅"},
    {"platform": "hwahae", "rank": 22, "brand": "조선미녀", "name": "맑은 쌀 선크림", "category": "sunscreen", "price": 15000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=쌀선크림"},
    {"platform": "hwahae", "rank": 23, "brand": "그라펜", "name": "비타민C 래디언스 세럼", "category": "serum", "price": 27000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=래디언스"},
    {"platform": "hwahae", "rank": 24, "brand": "티르티르", "name": "세라마이드 크림", "category": "cream", "price": 19000, "key_ingredients": ["Ceramide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=티르티르크림"},
    {"platform": "hwahae", "rank": 25, "brand": "미샤", "name": "비타씨 플러스 세럼", "category": "serum", "price": 14000, "key_ingredients": ["Vitamin C", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=비타씨플러스"},
    {"platform": "hwahae", "rank": 26, "brand": "브링그린", "name": "글리콜산 리뉴얼 패드", "category": "toner", "price": 18000, "key_ingredients": ["Glycolic Acid", "AHA"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=글리콜패드"},
    {"platform": "hwahae", "rank": 27, "brand": "풀리", "name": "히알루론산 세럼", "category": "serum", "price": 20000, "key_ingredients": ["Hyaluronic Acid", "Peptide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=히알세럼"},
    {"platform": "hwahae", "rank": 28, "brand": "이니스프리", "name": "레티놀 시카 크림", "category": "cream", "price": 28000, "key_ingredients": ["Retinol", "Ceramide"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=레티놀시카"},
    {"platform": "hwahae", "rank": 29, "brand": "에스네이처", "name": "아쿠아 오아시스 토너", "category": "toner", "price": 14000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=아쿠아토너"},
    {"platform": "hwahae", "rank": 30, "brand": "바이오더마", "name": "피그먼비오 세럼", "category": "serum", "price": 35000, "key_ingredients": ["Vitamin C", "Niacinamide", "Glycolic Acid"], "image_url": "https://placehold.co/300x300/fce4ec/FF6B9D?text=피그먼비오"},

    # ── 다이소 (daiso) ──
    {"platform": "daiso", "rank": 1, "brand": "VT", "name": "시카 수분 크림", "category": "cream", "price": 3000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=시카수분크림"},
    {"platform": "daiso", "rank": 2, "brand": "VT", "name": "리들샷 세럼", "category": "serum", "price": 3000, "key_ingredients": ["Niacinamide", "Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=리들샷세럼"},
    {"platform": "daiso", "rank": 3, "brand": "손앤박", "name": "비타민C 토너", "category": "toner", "price": 3000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=비타C토너"},
    {"platform": "daiso", "rank": 4, "brand": "손앤박", "name": "히알루론 세럼", "category": "serum", "price": 3000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=히알세럼"},
    {"platform": "daiso", "rank": 5, "brand": "클린뷰티", "name": "세라마이드 크림", "category": "cream", "price": 3000, "key_ingredients": ["Ceramide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=세라크림"},
    {"platform": "daiso", "rank": 6, "brand": "더마비", "name": "시카 젤 크림", "category": "cream", "price": 3000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=시카젤크림"},
    {"platform": "daiso", "rank": 7, "brand": "VT", "name": "시카 토너패드", "category": "toner", "price": 3000, "key_ingredients": ["Niacinamide", "AHA"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=시카토너패드"},
    {"platform": "daiso", "rank": 8, "brand": "손앤박", "name": "레티놀 세럼", "category": "serum", "price": 3000, "key_ingredients": ["Retinol"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=레티놀세럼"},
    {"platform": "daiso", "rank": 9, "brand": "클린뷰티", "name": "나이아신 앰플", "category": "ampoule", "price": 3000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=나이아신앰플"},
    {"platform": "daiso", "rank": 10, "brand": "더마비", "name": "수분 선크림", "category": "sunscreen", "price": 3000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=수분선크림"},
    {"platform": "daiso", "rank": 11, "brand": "VT", "name": "콜라겐 마스크", "category": "mask", "price": 1000, "key_ingredients": ["Peptide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=콜라겐마스크"},
    {"platform": "daiso", "rank": 12, "brand": "손앤박", "name": "글리콜산 토너", "category": "toner", "price": 3000, "key_ingredients": ["Glycolic Acid", "AHA"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=글리콜토너"},
    {"platform": "daiso", "rank": 13, "brand": "클린뷰티", "name": "AHA 필링 젤", "category": "cleanser", "price": 3000, "key_ingredients": ["AHA", "Glycolic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=AHA필링"},
    {"platform": "daiso", "rank": 14, "brand": "더마비", "name": "히알루론 미스트", "category": "toner", "price": 3000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=히알미스트"},
    {"platform": "daiso", "rank": 15, "brand": "VT", "name": "비타민C 마스크", "category": "mask", "price": 1000, "key_ingredients": ["Vitamin C"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=비타C마스크"},
    {"platform": "daiso", "rank": 16, "brand": "손앤박", "name": "펩타이드 크림", "category": "cream", "price": 3000, "key_ingredients": ["Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=펩타이드크림"},
    {"platform": "daiso", "rank": 17, "brand": "클린뷰티", "name": "그린티 클렌저", "category": "cleanser", "price": 3000, "key_ingredients": ["Green Tea Seed Oil"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=그린티클렌저"},
    {"platform": "daiso", "rank": 18, "brand": "더마비", "name": "BHA 클리어 세럼", "category": "serum", "price": 3000, "key_ingredients": ["Salicylic Acid", "Niacinamide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=BHA세럼"},
    {"platform": "daiso", "rank": 19, "brand": "VT", "name": "레티놀 크림", "category": "cream", "price": 3000, "key_ingredients": ["Retinol", "Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=레티놀크림"},
    {"platform": "daiso", "rank": 20, "brand": "손앤박", "name": "세라마이드 토너", "category": "toner", "price": 3000, "key_ingredients": ["Ceramide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=세라토너"},
    {"platform": "daiso", "rank": 21, "brand": "클린뷰티", "name": "수분 에센스", "category": "essence", "price": 3000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=수분에센스"},
    {"platform": "daiso", "rank": 22, "brand": "더마비", "name": "나이아신 크림", "category": "cream", "price": 3000, "key_ingredients": ["Niacinamide", "Ceramide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=나이아신크림"},
    {"platform": "daiso", "rank": 23, "brand": "VT", "name": "시카 클렌징 폼", "category": "cleanser", "price": 3000, "key_ingredients": ["Ceramide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=시카클렌징"},
    {"platform": "daiso", "rank": 24, "brand": "손앤박", "name": "콜라겐 세럼", "category": "serum", "price": 3000, "key_ingredients": ["Peptide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=콜라겐세럼"},
    {"platform": "daiso", "rank": 25, "brand": "클린뷰티", "name": "비타C 앰플", "category": "ampoule", "price": 3000, "key_ingredients": ["Vitamin C"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=비타C앰플"},
    {"platform": "daiso", "rank": 26, "brand": "더마비", "name": "알로에 수딩 젤", "category": "cream", "price": 3000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=알로에젤"},
    {"platform": "daiso", "rank": 27, "brand": "VT", "name": "프로바이옴 크림", "category": "cream", "price": 3000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=프로바이옴"},
    {"platform": "daiso", "rank": 28, "brand": "손앤박", "name": "AHA 필링 패드", "category": "toner", "price": 3000, "key_ingredients": ["AHA", "Glycolic Acid", "Niacinamide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=AHA패드"},
    {"platform": "daiso", "rank": 29, "brand": "클린뷰티", "name": "히알루론 아이크림", "category": "eye_cream", "price": 3000, "key_ingredients": ["Hyaluronic Acid", "Peptide"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=히알아이크림"},
    {"platform": "daiso", "rank": 30, "brand": "더마비", "name": "살리실산 스팟 젤", "category": "serum", "price": 3000, "key_ingredients": ["Salicylic Acid"], "image_url": "https://placehold.co/300x300/e3f2fd/0064FF?text=살리실산젤"},

    # ── Our AI (internal) ──
    {"platform": "internal", "rank": 1, "brand": "NIA Lab", "name": "하이드라 부스트 세럼", "category": "serum", "price": 35000, "key_ingredients": ["Hyaluronic Acid", "Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=하이드라부스트"},
    {"platform": "internal", "rank": 2, "brand": "NIA Lab", "name": "포어 리파인 세럼", "category": "serum", "price": 32000, "key_ingredients": ["Niacinamide", "Salicylic Acid", "AHA"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=포어리파인"},
    {"platform": "internal", "rank": 3, "brand": "NIA Lab", "name": "브라이트닝 비타C 앰플", "category": "ampoule", "price": 38000, "key_ingredients": ["Vitamin C", "Niacinamide", "Glycolic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=브라이트닝"},
    {"platform": "internal", "rank": 4, "brand": "NIA Lab", "name": "엘라스틴 리프트 크림", "category": "cream", "price": 42000, "key_ingredients": ["Peptide", "Retinol", "Ceramide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=엘라스틴"},
    {"platform": "internal", "rank": 5, "brand": "NIA Lab", "name": "안티링클 레티놀 세럼", "category": "serum", "price": 40000, "key_ingredients": ["Retinol", "Peptide", "Vitamin C"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=안티링클"},
    {"platform": "internal", "rank": 6, "brand": "NIA Lab", "name": "딥 히알루론 토너", "category": "toner", "price": 25000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=딥히알루론"},
    {"platform": "internal", "rank": 7, "brand": "NIA Lab", "name": "나이아신 클리어 에센스", "category": "essence", "price": 30000, "key_ingredients": ["Niacinamide", "Vitamin C"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=나이아신클리어"},
    {"platform": "internal", "rank": 8, "brand": "NIA Lab", "name": "세라마이드 배리어 크림", "category": "cream", "price": 33000, "key_ingredients": ["Ceramide", "Hyaluronic Acid", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=배리어크림"},
    {"platform": "internal", "rank": 9, "brand": "NIA Lab", "name": "AHA 리뉴잉 토너", "category": "toner", "price": 22000, "key_ingredients": ["AHA", "Glycolic Acid", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=AHA리뉴잉"},
    {"platform": "internal", "rank": 10, "brand": "NIA Lab", "name": "콜라겐 펩타이드 앰플", "category": "ampoule", "price": 45000, "key_ingredients": ["Peptide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=콜라겐펩타이드"},
    {"platform": "internal", "rank": 11, "brand": "NIA Lab", "name": "비타C 글로우 세럼", "category": "serum", "price": 36000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=비타C글로우"},
    {"platform": "internal", "rank": 12, "brand": "NIA Lab", "name": "수분 장벽 에센스", "category": "essence", "price": 28000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=수분장벽"},
    {"platform": "internal", "rank": 13, "brand": "NIA Lab", "name": "BHA 모공 세럼", "category": "serum", "price": 27000, "key_ingredients": ["Salicylic Acid", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=BHA모공"},
    {"platform": "internal", "rank": 14, "brand": "NIA Lab", "name": "멜라닌 컷 앰플", "category": "ampoule", "price": 39000, "key_ingredients": ["Vitamin C", "Niacinamide", "Retinol"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=멜라닌컷"},
    {"platform": "internal", "rank": 15, "brand": "NIA Lab", "name": "레티놀 0.5 크림", "category": "cream", "price": 38000, "key_ingredients": ["Retinol", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=레티놀크림"},
    {"platform": "internal", "rank": 16, "brand": "NIA Lab", "name": "그린티 밸런싱 토너", "category": "toner", "price": 20000, "key_ingredients": ["Green Tea Seed Oil", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=그린티밸런싱"},
    {"platform": "internal", "rank": 17, "brand": "NIA Lab", "name": "더블 세라마이드 크림", "category": "cream", "price": 35000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=더블세라"},
    {"platform": "internal", "rank": 18, "brand": "NIA Lab", "name": "포어 타이트닝 토너", "category": "toner", "price": 23000, "key_ingredients": ["AHA", "Salicylic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=포어타이트닝"},
    {"platform": "internal", "rank": 19, "brand": "NIA Lab", "name": "인텐시브 수분 마스크", "category": "mask", "price": 5000, "key_ingredients": ["Hyaluronic Acid", "Ceramide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=인텐시브마스크"},
    {"platform": "internal", "rank": 20, "brand": "NIA Lab", "name": "글리콜산 필링 패드", "category": "toner", "price": 25000, "key_ingredients": ["Glycolic Acid", "AHA", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=글리콜필링"},
    {"platform": "internal", "rank": 21, "brand": "NIA Lab", "name": "펩타이드 아이크림", "category": "eye_cream", "price": 32000, "key_ingredients": ["Peptide", "Retinol"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=펩타이드아이"},
    {"platform": "internal", "rank": 22, "brand": "NIA Lab", "name": "비타민 선크림", "category": "sunscreen", "price": 22000, "key_ingredients": ["Vitamin C", "Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=비타민선크림"},
    {"platform": "internal", "rank": 23, "brand": "NIA Lab", "name": "오일 프리 수분 젤", "category": "cream", "price": 26000, "key_ingredients": ["Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=오일프리젤"},
    {"platform": "internal", "rank": 24, "brand": "NIA Lab", "name": "안티에이징 나이트 크림", "category": "cream", "price": 48000, "key_ingredients": ["Retinol", "Peptide", "Ceramide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=나이트크림"},
    {"platform": "internal", "rank": 25, "brand": "NIA Lab", "name": "시카 리커버리 크림", "category": "cream", "price": 29000, "key_ingredients": ["Ceramide", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=시카리커버리"},
    {"platform": "internal", "rank": 26, "brand": "NIA Lab", "name": "나이아신 브라이트닝 토너", "category": "toner", "price": 21000, "key_ingredients": ["Niacinamide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=브라이트닝토너"},
    {"platform": "internal", "rank": 27, "brand": "NIA Lab", "name": "살리실산 클렌저", "category": "cleanser", "price": 18000, "key_ingredients": ["Salicylic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=살리실산클렌저"},
    {"platform": "internal", "rank": 28, "brand": "NIA Lab", "name": "울트라 하이드레이팅 앰플", "category": "ampoule", "price": 37000, "key_ingredients": ["Hyaluronic Acid", "Ceramide", "Green Tea Seed Oil"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=울트라하이드"},
    {"platform": "internal", "rank": 29, "brand": "NIA Lab", "name": "비타민E 영양 크림", "category": "cream", "price": 31000, "key_ingredients": ["Ceramide", "Hyaluronic Acid"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=비타민E크림"},
    {"platform": "internal", "rank": 30, "brand": "NIA Lab", "name": "올인원 스킨 에센스", "category": "essence", "price": 28000, "key_ingredients": ["Niacinamide", "Hyaluronic Acid", "Peptide"], "image_url": "https://placehold.co/300x300/e8eaf6/5B8CFF?text=올인원에센스"},
]
# fmt: on


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if platform products already exist
        existing = (
            db.query(Product)
            .filter(Product.platform.isnot(None))
            .count()
        )
        if existing > 0:
            print(f"Already {existing} platform products in DB. Skipping seed.")
            return

        for item in PRODUCTS:
            skin_targets = _derive_skin_targets(item["key_ingredients"])
            product = Product(
                brand=item["brand"],
                product_name=item["name"],
                category=item["category"],
                price=item["price"],
                key_ingredients=item["key_ingredients"],
                image_url=item["image_url"],
                platform=item["platform"],
                popularity_rank=item["rank"],
                skin_targets=skin_targets,
                is_active=True,
            )
            db.add(product)

        db.commit()
        print(f"Seeded {len(PRODUCTS)} platform products successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
