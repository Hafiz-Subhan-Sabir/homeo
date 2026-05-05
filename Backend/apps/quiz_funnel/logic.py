from .quiz_data import QUIZ_QUESTIONS

SCORE_MAP = {"A": 1, "B": 3, "C": 5, "D": 10}
OPTION_INDEX_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}
ARCHETYPE_WEAPON_MATRIX = {
    "Profit Raider": {
        "entry": "Print On Demand / Affiliate Marketing",
        "elite": "Crypto Trading (Technical Analysis)",
    },
    "Attention Broker": {
        "entry": "Graphics Design (Canva) / WordPress Blog",
        "elite": "Faceless YouTube AI / Unreal Engine",
    },
    "System Architect": {
        "entry": "Kindle Publishing (KDP) / Prompt Engineering",
        "elite": "A.I. Automations / Framer Crash Course",
    },
    "Ghost Architect": {
        "entry": "Python Programming",
        "elite": "A.I. Agents / React JS / Flutter / Solidity",
    },
}
SHIELD_BY_VIRUS = {
    "Inconsistency/Analysis Paralysis": "Mastering Consistency",    
    "Employee Mindset/Fear": "The 9 to 5 Exit Strategy",             
    "The Chaos Agent/No Map": "Syndicate 13 Business Rules",           
    "The Victim/Guru Trauma": "Syndicate Money Philosophy",           
    "Technical Illiteracy": "Zero to One Million",                                              
    "The Amateur/Scaling Ceiling": "Zero to One Million",             
    "The Spender/Status Trap": "The Compound Effect",                
    "Emotional/Reactive": "The Art of Critical Thinking",                       
    "The Loner/No Trust": "The Art of Mastering Human Behavior",                             
    "The Order Taker/No Sales": "The Art of Business Persuasion",                              
    "Identity Crisis/Fraud": "The Secret To Transformation",           
    "The Slow Burner/Low Energy": "Hustle Hard",
    "The Visionary/No Structure": "The Business of Empire Building",
}
PROTOCOL_BY_DESIGNATION = {
    "THE STREET SOLDIER": "The Secret To Transformation",
    "THE ROGUE OPERATOR": "The 9 to 5 Exit Strategy",
    "THE SYNDICATE SPECIALIST": "The Art of Critical Thinking",
    "THE PROSPECT (EMPIRE TIER)": "The Business of Empire Building",
}
ARCHETYPE_BY_Q5_OPTION = {
    "A": "Profit Raider",
    "B": "Attention Broker",
    "C": "System Architect",
    "D": "Ghost Architect",
}
# Canonical virus labels shown in UI/report and mapped to Shield logic.
FATAL_FLAW_BY_QUESTION_OPTION = {
    1: {
        "A": "The Slow Burner/Low Energy",
        "B": "Employee Mindset/Fear",
        "C": "The Chaos Agent/No Map",
        "D": "The Loner/No Trust",
    },
    3: {
        "A": "Inconsistency/Analysis Paralysis",
        "B": "The Victim/Guru Trauma",
        "C": "The Amateur/Scaling Ceiling",
        "D": "The Visionary/No Structure",
    },
    8: {
        "A": "Inconsistency/Analysis Paralysis",
        "B": "The Spender/Status Trap",
        "C": "Inconsistency/Analysis Paralysis",
        "D": "The Loner/No Trust",
    },
    9: {
        "A": "The Slow Burner/Low Energy",
        "B": "The Order Taker/No Sales",
        "C": "The Amateur/Scaling Ceiling",
        "D": None,  # High readiness signal, not a virus.
    },
    10: {
        "A": "The Loner/No Trust",
        "B": "The Spender/Status Trap",
        "C": "The Amateur/Scaling Ceiling",
        "D": "The Visionary/No Structure",
    },
    11: {
        "A": "Employee Mindset/Fear",
        "B": "The Spender/Status Trap",
        "C": "The Loner/No Trust",
        "D": "The Chaos Agent/No Map",
    },
    16: {
        "A": "The Order Taker/No Sales",
        "B": "Identity Crisis/Fraud",
        "C": "The Slow Burner/Low Energy",
        "D": "Emotional/Reactive",
    },
}

HIGH_STAKES_DIAGNOSTIC_IDS = {10}


def compute_score(answers: list[dict]) -> int:
    return sum(SCORE_MAP[item["selected_option"]] for item in answers)


def get_category(score: int) -> str:
    if 17 <= score <= 50:
        return "THE STREET SOLDIER"
    if 51 <= score <= 100:
        return "THE ROGUE OPERATOR"
    if 101 <= score <= 140:
        return "THE SYNDICATE SPECIALIST"
    return "THE PROSPECT (EMPIRE TIER)"


def _extract_tag(option_text: str) -> str:
    if "(" in option_text and ")" in option_text:
        return option_text.split("(")[-1].replace(")", "").strip()
    return "Unknown"


def build_answer_lookup() -> dict[int, dict[str, str]]:
    lookup: dict[int, dict[str, str]] = {}
    for question in QUIZ_QUESTIONS:
        mapping: dict[str, str] = {}
        for letter, index in OPTION_INDEX_MAP.items():
            mapping[letter] = question["options"][index]
        lookup[question["id"]] = mapping
    return lookup


def detect_archetype(answers: list[dict]) -> str:
    archetype_counts = {
        "Ghost Architect": 0,
        "Attention Broker": 0,
        "System Architect": 0,
        "Profit Raider": 0,
    }
    q7_archetype_map = {
        "A": "Profit Raider",
        "B": "Ghost Architect",
        "C": "Attention Broker",
        "D": "System Architect",
    }
    for item in answers:
        question_id = item["question_id"]
        letter = item["selected_option"]
        if question_id == 5:
            mapped = ARCHETYPE_BY_Q5_OPTION.get(letter)
            if mapped:
                archetype_counts[mapped] += 1
        elif question_id == 7:
            mapped = q7_archetype_map.get(letter)
            if mapped:
                archetype_counts[mapped] += 1

    for archetype in ["Ghost Architect", "Attention Broker", "System Architect", "Profit Raider"]:
        if archetype_counts[archetype] == max(archetype_counts.values()):
            return archetype
    return "System Architect"


def detect_fatal_flaw(answers: list[dict]) -> str:
    diagnostic_question_ids = set(FATAL_FLAW_BY_QUESTION_OPTION.keys())
    weighted_scores: dict[str, int] = {}
    frequency: dict[str, int] = {}

    for item in answers:
        question_id = item["question_id"]
        if question_id not in diagnostic_question_ids:
            continue

        letter = item.get("selected_option")
        if letter not in SCORE_MAP:
            continue

        virus = FATAL_FLAW_BY_QUESTION_OPTION.get(question_id, {}).get(letter)
        if not virus:
            continue

        frequency[virus] = frequency.get(virus, 0) + 1

        # Pattern recognition + intensity weighting.
        # Repeated virus admissions dominate, while high-point options and
        # high-stakes diagnostic prompts (like Q10) get extra influence.
        weight = 1 + SCORE_MAP[letter]
        if question_id in HIGH_STAKES_DIAGNOSTIC_IDS:
            weight += 6
        weighted_scores[virus] = weighted_scores.get(virus, 0) + weight

    if not weighted_scores:
        return "Inconsistency/Analysis Paralysis"

    priority_order = list(SHIELD_BY_VIRUS.keys())
    ranked = sorted(
        weighted_scores.keys(),
        key=lambda virus: (
            weighted_scores[virus],
            frequency.get(virus, 0),
            -priority_order.index(virus) if virus in priority_order else -9999,
        ),
        reverse=True,
    )
    return ranked[0]


def get_recommended_shield(fatal_flaw: str) -> str:
    normalized = (fatal_flaw or "").strip()
    if normalized in SHIELD_BY_VIRUS:
        return SHIELD_BY_VIRUS[normalized]
    # Case-insensitive fallback to keep mapping stable with variant casing.
    lowered = normalized.lower()
    for key, value in SHIELD_BY_VIRUS.items():
        if key.lower() == lowered:
            return value
    return "Syndicate 13 Business Rules"


def get_recommended_protocol(designation: str) -> str:
    return PROTOCOL_BY_DESIGNATION.get(designation, "Syndicate 13 Business Rules")


def _get_budget_tier_from_answers(answers: list[dict]) -> str | None:
    for item in answers:
        if item.get("question_id") != 14:
            continue
        letter = item.get("selected_option")
        if letter in {"A", "B"}:
            return "entry"
        if letter in {"C", "D"}:
            return "elite"
    return None


def get_weapon_course(archetype: str, score: int, answers: list[dict] | None = None) -> str:
    mapping = ARCHETYPE_WEAPON_MATRIX.get(archetype)
    if not mapping:
        return "Python Programming"

    # Primary ammunition filter: Q14 (War Chest / Liquid Capital).
    budget_tier = _get_budget_tier_from_answers(answers or [])
    if budget_tier in {"entry", "elite"}:
        return mapping[budget_tier]

    # Fallback by power-level score brackets.
    # Street Soldier + Rogue Operator => entry-tier weapon.
    # Syndicate Specialist + Prospect => elite-tier weapon.
    return mapping["entry"] if score <= 100 else mapping["elite"]
