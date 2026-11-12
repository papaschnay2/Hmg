#!/usr/bin/env python3
"""Turn the research files in data/research/*.json into movies.js.

Each movie is sorted into one option per reel (her job, place, his job) using the
keyword rules below; first matching rule wins. To overrule the rules for one movie,
add "her_bucket", "place_bucket" or "him_bucket" to its entry in the research file.

Run from the repo root:  python3 tools/build_movies.py
"""
import glob, json, re, sys
from collections import Counter

HER_RULES = [
    ("royal", r"\b(princess|queen|duchess|countess)\b"),
    ("medic", r"doctor|surgeon|surgical|nurse|veterinar|\bvet\b|pediatric|physician|optometrist|dentist|paramedic|therapist|urgent care|\bER\b"),
    ("lawyer", r"lawyer|attorney|prosecutor|judge|paralegal"),
    ("teacher", r"teacher|professor|librarian|principal|tutor|choir leader|choir director|historian|neuroscien|superintendent"),
    ("planner", r"planner|organizer|event coordinator|events? (manager|director)"),
    ("baker", r"baker|bakery|chef|pastry|\bcook\b|restaurat|caterer|chocolat|caf[eé]|barista|sommelier|confection"),
    ("helper", r"assistant|nanny|governess|\bmaid\b|housekeeper|house manager|caregiver|social worker|nonprofit|charity|volunteer"),
    ("writer", r"writer|journalist|reporter|author|novelist|blogger|editor|columnist|anchor|\btv\b|television|host\b|news|screenwriter|producer|podcast|critic|publisher|meteorolog|guru|influencer"),
    ("performer", r"singer|actress|musician|dancer|ballerina|pianist|violin|cellist|pop star|country (music )?star|songwriter|composer|skater|rockette"),
    ("designer", r"designer|decorator|stylist|window dresser|seamstress|tailor"),
    ("artist", r"artist|painter|photographer|illustrator|sculptor|potter|curator|gallery"),
    ("realty", r"real estate|realtor|architect|developer|house flipper|home renovat"),
    ("service", r"soldier|army|navy|military|police|detective|firefighter|pilot|marine|sheriff|\bcop\b|air force|coast guard"),
    ("shop", r"owner|boutique|bookshop|bookstore|florist|innkeeper|shopkeeper|antique|runs (a|her|the) "),
    ("exec", r"executive|\bexec\b|\bceo\b|marketing|advertising|consultant|corporate|businesswoman|manager|director|publicist|public relations|\bpr\b|financ|accountant|banker|analyst|entrepreneur|workaholic|investor|\btech\b|buyer|founder|startup|efficiency"),
]
HIM_RULES = [
    ("santa", r"santa|angel|\belf\b|ghost|kris kringle"),
    ("royal", r"\b(prince|king|duke|earl|lord|count|royal)\b"),
    ("hero", r"firefighter|fireman|police|\bcop\b|sheriff|detective|soldier|army|navy|marine|military|sergeant|veteran|pilot|coast guard|ranger|search and rescue|air force|captain|naval|officer|\bfbi\b|investigator|bodyguard|security guard|deputy|fire chief"),
    ("medic", r"doctor|surgeon|veterinar|\bvet\b|nurse|paramedic|pediatric|physician|\bemt\b|cardiolog"),
    ("farmer", r"farmer|rancher|ranch|cowboy|tree farm|vineyard|winemaker|orchard|\bfarm\b"),
    ("builder", r"carpenter|contractor|handyman|woodwork|builder|construction|mechanic|restoration|architect|craftsman|furniture|artisan|landscap|electrician|plumber"),
    ("chef", r"chef|baker|\bcook\b|restaurant|restaurateur|pastry|chocolat|barista|brewer|\bdeli\b|cater"),
    ("teacher", r"teacher|professor|principal|tutor"),
    ("athlete", r"hockey|football|baseball|athlete|player|coach|skier|ski instructor|quarterback|olympi|skater"),
    ("lawyer", r"lawyer|attorney|judge|mayor|politician|senator|council"),
    ("artist", r"singer|musician|actor|\bstar\b|artist|photographer|songwriter|composer|dancer|dance instructor|painter|celebrity|filmmaker|guitarist|\bband\b|performer|broadway"),
    ("writer", r"writer|journalist|reporter|author|novelist|editor|columnist|blogger|weatherman|anchor|critic|newscaster|producer"),
    ("suit", r"business owner|executive|\bceo\b|businessman|entrepreneur|developer|investor|consultant|boss|millionaire|billionaire|\bheir\b|manager|banker|financ|\btech\b|wealthy|corporate|marketing|advertising|director|founder|business partner|\bsales\b|investment|real estate|realtor|philanthropist|\bcfo\b|accountant|promoter"),
    ("host", r"innkeeper|hotelier|shopkeeper|clerk|bartender|(inn|lodge|shop|store|bookstore|bar|caf[eé]|diner|hotel|lot|shelter) owner|owner of|owns (a|the|his)|runs (a|the|his)"),
    ("dad", r"single (dad|father)|widow(er|ed father)|father of"),
]
LANDMARK = r"dollywood|graceland|biltmore|opry|disney|plaza hotel|rockefeller|\b(chiefs|bills|bears)\b"
REAL_ABROAD = r"england|london|scotland|ireland|irish|paris|france|italy|rome|vienna|austria|germany|heidelberg|norway|finland|iceland|switzerland|denmark|copenhagen|canterbury|notting hill|europe"
PLACE_TEXT_RULES = [
    ("hometown", r"home ?town"),
    ("farm", r"ranch|farm|vineyard|orchard"),
    ("inn", r"\binn\b|lodge|resort|hotel|chalet|estate|manor"),
    ("europe", REAL_ABROAD),
    ("kingdom", r"kingdom|palace|castle"),
    ("other", r"alaska|north ?pole|train|cruise|military base|naval|hawaii|island|summer camp|diner|academy|cottage"),
    ("city", r"new york|manhattan|chicago|los angeles|boston|seattle|nashville|san francisco|philadelphia|queens|brooklyn|tulsa|kansas city|wichita|chinatown|suburb|memphis|denver|dallas|atlanta|washington, d\.?c"),
    ("smalltown", r"town|village"),
]
TYPE_TO_PLACE = {"her_hometown": "hometown", "small_town": "smalltown", "big_city": "city",
                 "inn_lodge_resort": "inn", "farm_ranch_vineyard": "farm", "other": "other"}
NOT_A_JOB = r"not stated|unknown|unclear|single (mother|mom)|^(recent |young )?widow"


def bucket(text, rules):
    if not text:
        return None
    for name, pattern in rules:
        if re.search(pattern, text, re.I):
            return name
    return None if re.search(NOT_A_JOB, text, re.I) else "other"


def place_bucket(text, kind):
    blob = text or ""
    if re.search(LANDMARK, blob, re.I):
        return "landmark"
    if kind == "europe_or_kingdom":
        return "europe" if re.search(REAL_ABROAD, blob, re.I) else "kingdom"
    if kind in TYPE_TO_PLACE and kind != "other":
        return TYPE_TO_PLACE[kind]
    # No usable type: go by the text. A bare state name ("Vermont") tells us nothing.
    for name, pattern in PLACE_TEXT_RULES:
        if re.search(pattern, blob, re.I):
            return name
    return None


def tidy(text):
    if not text:
        return None
    text = re.sub(r"\s*\((job )?not stated\)", "", text).strip()
    return text[:1].upper() + text[1:] if text else None


def main():
    movies, seen = [], set()
    for path in sorted(glob.glob("data/research/*.json")):
        for m in json.load(open(path, encoding="utf-8")):
            key = (m["title"].lower(), m["year"])
            if key in seen or m.get("skip"):
                continue
            seen.add(key)
            romance = m.get("romance") is not False
            movies.append({
                "t": m["title"], "y": m["year"], "n": m.get("network"),
                "ha": m.get("her_actor"), "ia": m.get("his_actor"),
                "hj": tidy(m.get("her_job")), "ij": tidy(m.get("his_job")), "loc": tidy(m.get("location")),
                "her": m.get("her_bucket") or (bucket(m.get("her_job"), HER_RULES) if romance else None),
                "place": m.get("place_bucket") or place_bucket(m.get("location"), m.get("location_type")),
                "him": m.get("him_bucket") or (bucket(m.get("his_job"), HIM_RULES) if romance else None),
                "tr": m.get("tropes") or [], "s": m.get("summary"),
            })
    movies.sort(key=lambda m: (m["y"], m["t"]))
    with open("movies.js", "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_movies.py from data/research/*.json. Edit those files, not this one.\n")
        f.write("const MOVIES = [\n")
        for m in movies:
            f.write("  " + json.dumps({k: v for k, v in m.items() if v not in (None, [])}, ensure_ascii=False) + ",\n")
        f.write("];\n")

    full = [m for m in movies if m["her"] and m["place"] and m["him"]]
    print(f"{len(movies)} movies, {len(full)} with all three details")
    for key, raw in (("her", "hj"), ("place", "loc"), ("him", "ij")):
        print(f"\n{key}: {dict(Counter(m[key] for m in movies if m[key]).most_common())}")
        if "-v" in sys.argv:
            for m in movies:
                if m[key]:
                    print(f"   {m[key]:10} {m[raw]}  [{m['t']}]")


if __name__ == "__main__":
    main()
