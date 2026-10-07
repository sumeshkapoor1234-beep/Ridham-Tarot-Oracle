import random
import time
from datetime import datetime

 ==========================================
 1. MAJOR ARCANA DATA (22 CARDS)
 ==========================================

MAJOR_ARCANA = {
    "0. The Fool": {
        "Category": "Major Arcana",
        "Element": "Air", "Zodiac/Planet": "Uranus",
        "Upright": "New beginnings, innocence, spontaneity, free spirit, leaps of faith.",
        "Reversed": "Recklessness, risk-taking, hesitation, bad judgment, foolish delay.",
        "Affirmation": "I step into the unknown with an open heart and complete trust."
    },
    "I. The Magician": {
        "Category": "Major Arcana",
        "Element": "Air", "Zodiac/Planet": "Mercury",
        "Upright": "Manifestation, resourcefulness, power, inspired action, skill.",
        "Reversed": "Illusion, manipulation, wasted talent, trickery, poor planning.",
        "Affirmation": "I have all the tools and power necessary to manifest my vision."
    },
    "II. The High Priestess": {
        "Category": "Major Arcana",
        "Element": "Water", "Zodiac/Planet": "Moon",
        "Upright": "Intuition, sacred knowledge, divine feminine, subconscious mind.",
        "Reversed": "Secrets, disconnected from intuition, surface-level focus, repression.",
        "Affirmation": "I trust my inner wisdom and honor the secrets of my soul."
    },
    "III. The Empress": {
        "Category": "Major Arcana",
        "Element": "Earth", "Zodiac/Planet": "Venus",
        "Upright": "Femininity, beauty, nature, nurturing, abundance, fertility.",
        "Reversed": "Creative block, dependence, smothering, insecurity, neglect.",
        "Affirmation": "Abundance flows through me and surrounds my life."
    },
    "IV. The Emperor": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Aries",
        "Upright": "Authority, structure, control, father figure, solid foundation.",
        "Reversed": "Tyranny, rigidity, lack of discipline, loss of control, dominance.",
        "Affirmation": "I build my life on structure, discipline, and stable foundations."
    },
    "V. The Hierophant": {
        "Category": "Major Arcana",
        "Element": "Earth", "Zodiac/Planet": "Taurus",
        "Upright": "Spiritual wisdom, tradition, institutions, conformity, beliefs.",
        "Reversed": "Rebellion, unconventionality, new approaches, hypocrisy.",
        "Affirmation": "I honor truth and live according to my core values."
    },
    "VI. The Lovers": {
        "Category": "Major Arcana",
        "Element": "Air", "Zodiac/Planet": "Gemini",
        "Upright": "Love, harmony, relationships, values alignment, meaningful choices.",
        "Reversed": "Disharmony, imbalance, misaligned values, bad decisions, conflict.",
        "Affirmation": "I choose relationships rooted in love, alignment, and truth."
    },
    "VII. The Chariot": {
        "Category": "Major Arcana",
        "Element": "Water", "Zodiac/Planet": "Cancer",
        "Upright": "Control, willpower, success, action, determination, victory.",
        "Reversed": "Lack of control, opposition, lack of direction, aggression.",
        "Affirmation": "I harness my energy and drive forward toward victory."
    },
    "VIII. Strength": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Leo",
        "Upright": "Courage, persuasion, influence, compassion, inner power.",
        "Reversed": "Self-doubt, raw emotion, vulnerability, low energy, weakness.",
        "Affirmation": "My true strength lies in compassion, patience, and courage."
    },
    "IX. The Hermit": {
        "Category": "Major Arcana",
        "Element": "Earth", "Zodiac/Planet": "Virgo",
        "Upright": "Soul-searching, introspection, solitude, inner guidance, truth.",
        "Reversed": "Loneliness, isolation, paranoia, withdrawal, exclusion.",
        "Affirmation": "In quiet solitude, I find the light of my inner wisdom."
    },
    "X. Wheel of Fortune": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Jupiter",
        "Upright": "Good luck, karma, life cycles, destiny, pivotal turning point.",
        "Reversed": "Bad luck, resistance to change, breaking negative cycles.",
        "Affirmation": "I embrace the ever-changing flow of life and trust destiny."
    },
    "XI. Justice": {
        "Category": "Major Arcana",
        "Element": "Air", "Zodiac/Planet": "Libra",
        "Upright": "Justice, fairness, truth, cause and effect, legal matters.",
        "Reversed": "Unfairness, lack of accountability, dishonesty, bias, blame.",
        "Affirmation": "I act with integrity, equity, and absolute honesty."
    },
    "XII. The Hanged Man": {
        "Category": "Major Arcana",
        "Element": "Water", "Zodiac/Planet": "Neptune",
        "Upright": "Pause, surrender, letting go, gaining new perspectives.",
        "Reversed": "Delays, resistance, stalling, unnecessary sacrifice, stagnation.",
        "Affirmation": "I release control and allow new perspectives to enlighten me."
    },
    "XIII. Death": {
        "Category": "Major Arcana",
        "Element": "Water", "Zodiac/Planet": "Scorpio",
        "Upright": "Endings, change, radical transformation, transition, rebirth.",
        "Reversed": "Fear of change, holding on, stagnancy, decay, resistance.",
        "Affirmation": "I gracefully release the old to make room for transformative new energy."
    },
    "XIV. Temperance": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Sagittarius",
        "Upright": "Balance, moderation, patience, purpose, inner harmony.",
        "Reversed": "Imbalance, excess, self-healing needed, hastiness, friction.",
        "Affirmation": "I bring harmony, patience, and balance to every situation."
    },
    "XV. The Devil": {
        "Category": "Major Arcana",
        "Element": "Earth", "Zodiac/Planet": "Capricorn",
        "Upright": "Shadow self, attachment, addiction, restriction, materialism.",
        "Reversed": "Freedom, release, restoring control, breaking chains.",
        "Affirmation": "I reclaim my personal power and break free from toxic bindings."
    },
    "XVI. The Tower": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Mars",
        "Upright": "Sudden change, upheaval, chaos, revelation, awakening.",
        "Reversed": "Disaster avoided, delaying the inevitable, fear of collapse.",
        "Affirmation": "Breakthroughs follow breakdown; I rebuild on solid truth."
    },
    "XVII. The Star": {
        "Category": "Major Arcana",
        "Element": "Air", "Zodiac/Planet": "Aquarius",
        "Upright": "Hope, faith, purpose, renewal, inspiration, spiritual peace.",
        "Reversed": "Faithlessness, despair, self-doubt, discouragement, apathy.",
        "Affirmation": "Hope illuminates my pathway, filling me with peace and trust."
    },
    "XVIII. The Moon": {
        "Category": "Major Arcana",
        "Element": "Water", "Zodiac/Planet": "Pisces",
        "Upright": "Illusion, fear, anxiety, subconscious mind, intuition, mystery.",
        "Reversed": "Release of fear, repressed emotion, clarity, uncovering truth.",
        "Affirmation": "I look past shadows and illusions to embrace clarity."
    },
    "XIX. The Sun": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Sun",
        "Upright": "Positivity, fun, warmth, success, vitality, joy, brilliance.",
        "Reversed": "Temporary clouds, sadness, overly optimistic, inner child work.",
        "Affirmation": "Joy, brilliance, and vital success illuminate my life."
    },
    "XX. Judgement": {
        "Category": "Major Arcana",
        "Element": "Fire", "Zodiac/Planet": "Pluto",
        "Upright": "Judgement, rebirth, inner calling, absolution, awakening.",
        "Reversed": "Self-doubt, harsh criticism, ignoring the call, regret.",
        "Affirmation": "I step into my higher calling without fear or self-criticism."
    },
    "XXI. The World": {
        "Category": "Major Arcana",
        "Element": "Earth", "Zodiac/Planet": "Saturn",
        "Upright": "Completion, integration, accomplishment, travel, fulfillment.",
        "Reversed": "Incompletion, seeking closure, short-cuts, unfinished business.",
        "Affirmation": "I celebrate my journey, honoring the completion of this chapter."
    }
}


 ==========================================
 2. ADVANCED MINOR ARCANA GENERATOR (56 CARDS)
 ==========================================

SUITS = {
    "Wands": {
        "Element": "Fire",
        "Upright": "Passion, ambition, creation, willpower, and vital energy",
        "Reversed": "Ego conflicts, burnout, misdirected action, or creative blockage"
    },
    "Cups": {
        "Element": "Water",
        "Upright": "Emotional depth, relationships, intuition, and spiritual connection",
        "Reversed": "Emotional volatility, detachment, heartbreak, or moodiness"
    },
    "Swords": {
        "Element": "Air",
        "Upright": "Intellect, clear truth, communication, and decisive mental action",
        "Reversed": "Anxiety, overthinking, harsh words, deceit, or mental overload"
    },
    "Pentacles": {
        "Element": "Earth",
        "Upright": "Material abundance, practical physical results, wealth, and stability",
        "Reversed": "Financial stress, insecurity, neglect of physical health, or greed"
    }
}

RANKS = {
    "Ace": {
        "Upright": "New raw potential and a powerful fresh beginning in",
        "Reversed": "Delayed start or missed opportunity regarding",
        "Affirmation": "I welcome new opportunities with enthusiasm."
    },
    "Two": {
        "Upright": "Balance, partnership, and essential choices concerning",
        "Reversed": "Imbalance, indecision, or misaligned priorities in",
        "Affirmation": "I make balanced decisions aligned with my truth."
    },
    "Three": {
        "Upright": "Growth, teamwork, and early expansion in",
        "Reversed": "Lack of progress, miscommunication, or delays in",
        "Affirmation": "Collaboration and vision fuel my ongoing growth."
    },
    "Four": {
        "Upright": "Solid stability, security, and firm foundations in",
        "Reversed": "Stagnation, rigidity, or fear of losing control over",
        "Affirmation": "I rest securely upon the stable foundations I build."
    },
    "Five": {
        "Upright": "Conflict, temporary challenge, or loss regarding",
        "Reversed": "Resolution, moving past hardship, and recovery in",
        "Affirmation": "I grow stronger through every challenge I face."
    },
    "Six": {
        "Upright": "Harmony, success, generosity, and progress in",
        "Reversed": "Standing still, selfishness, or delayed recognition in",
        "Affirmation": "I share my success and accept help when needed."
    },
    "Seven": {
        "Upright": "Strategic planning, assessment, and perseverance in",
        "Reversed": "Impatience, self-doubt, or deceptive shortcuts regarding",
        "Affirmation": "Patience and strategy guide my long-term effort."
    },
    "Eight": {
        "Upright": "Mastery, focused movement, and rapid progress in",
        "Reversed": "Frustration, lack of effort, or energetic delays in",
        "Affirmation": "My dedicated focus yields expertise and momentum."
    },
    "Nine": {
        "Upright": "Fruitful realization, self-reliance, and near completion in",
        "Reversed": "Defeat, dissatisfaction, fatigue, or stress over",
        "Affirmation": "I honor how far I have come and trust what lies ahead."
    },
    "Ten": {
        "Upright": "Culmination, ultimate completion, and legacy regarding",
        "Reversed": "Burnout, heavy burdens, or painful endings in",
        "Affirmation": "I celebrate full completion and release heavy burdens."
    },
    "Page": {
        "Upright": "Curiosity, inspirational messages, and fresh ideas about",
        "Reversed": "Immaturity, procrastination, or bad news concerning",
        "Affirmation": "I remain open to learning and fresh perspectives."
    },
    "Knight": {
        "Upright": "Direct action, drive, and intense pursuit of goals in",
        "Reversed": "Impulsiveness, reckless speed, or complete inaction regarding",
        "Affirmation": "I take purposeful, courageous action toward my targets."
    },
    "Queen": {
        "Upright": "Nurturing mastery, emotional intelligence, and authority over",
        "Reversed": "Insecurity, coldness, or codependence in matters of",
        "Affirmation": "I lead with intuition, grace, and grounded mastery."
    },
    "King": {
        "Upright": "Leadership, external mastery, and full control over",
        "Reversed": "Tyranny, manipulation, or ineffective management of",
        "Affirmation": "I exercise wise leadership and command my reality."
    }
}

def build_full_deck():
    """Combines Major Arcana and dynamically generated Minor Arcana into one deck."""
    deck = {}
    
    for card, data in MAJOR_ARCANA.items():
        deck[card] = data
        
    for suit_name, suit_data in SUITS.items():
        for rank_name, rank_data in RANKS.items():
            card_name = f"{rank_name} of {suit_name}"
            deck[card_name] = {
                "Category": "Minor Arcana",
                "Element": suit_data["Element"],
                "Zodiac/Planet": suit_name,
                "Upright": f"{rank_data['Upright']} {suit_data['Upright'].lower()}.",
                "Reversed": f"{rank_data['Reversed']} {suit_data['Reversed'].lower()}.",
                "Affirmation": rank_data["Affirmation"]
            }
    return deck

TAROT_DECK = build_full_deck()


 ==========================================
 3. INTERACTIVE SPREAD DEFINITIONS
 ==========================================

SPREADS = {
    "1": {
        "Name": "Single Card (Daily Focus)",
        "Positions": ["Core Insight & Daily Focus"]
    },
    "2": {
        "Name": "Past, Present, Future",
        "Positions": ["Past Foundations", "Present Energy", "Future Trajectory"]
    },
    "3": {
        "Name": "Mind, Body, Spirit Alignment",
        "Positions": ["Mental State (Mind)", "Physical Reality (Body)", "Spiritual Path (Spirit)"]
    },
    "4": {
        "Name": "Situation, Obstacle, Outcome",
        "Positions": ["Current Situation", "Primary Obstacle", "Likely Outcome"]
    },
    "5": {
        "Name": "Celtic Cross Spread (10 Cards)",
        "Positions": [
            "1. Present Situation",
            "2. Immediate Challenge",
            "3. Distant Past / Foundation",
            "4. Recent Past",
            "5. Higher Purpose / Best Potential",
            "6. Near Future",
            "7. Your Power / Self-Image",
            "8. External Environment & Influences",
            "9. Hopes and Fears",
            "10. Final Outcome"
        ]
    }
}
 ==========================================
 4. HELPER FUNCTIONS & DISPLAY
 ==========================================

def print_banner():
    print("\n" + "=" * 65)
    print("           ✨ RIDHAM'S MYSTIC TAROT ORACLE ✨            ")
    print("     Rhythmic Wisdom for Past, Present & Future Pathways ")
    print("=" * 65)

def select_spread():
    print("\nSelect your Tarot Spread:")
    for key, spread in SPREADS.items():
        print(f"  [{key}] {spread['Name']} ({len(spread['Positions'])} Cards)")
    print()
    
    while True:
        choice = input("Enter choice (1-5): ").strip()
        if choice in SPREADS:
            return SPREADS[choice]["Positions"], SPREADS[choice]["Name"]
        print("Invalid choice. Please enter a number between 1 and 5.")

def draw_cards(positions):
    print("\nDrawing Mode:")
    print("  [A] Automatic Draw (Universal shuffle and pull)")
    print("  [M] Manual Selection (Choose card numbers yourself)")
    mode = input("Choose mode (A/M): ").strip().upper()
    
    deck_keys = list(TAROT_DECK.keys())
    random.shuffle(deck_keys)
    results = []
    
    if mode == "M":
        print(f"\nThe deck contains {len(deck_keys)} cards (indexed 1 to {len(deck_keys)}).")
        for pos in positions:
            while True:
                try:
                    idx = int(input(f"  -> Choose index (1-{len(deck_keys)}) for '{pos}': ")) - 1
                    if 0 <= idx < len(deck_keys):
                        card_name = deck_keys.pop(idx)
                        orientation = random.choice(["Upright", "Reversed"])
                        results.append((pos, card_name, orientation))
                        break
                    else:
                        print("Out of range. Try again.")
                except ValueError:
                    print("Please enter a valid number.")
    else:
        print("\nShuffling the deck...")
        time.sleep(1)
        selected_cards = random.sample(deck_keys, len(positions))
        for pos, card_name in zip(positions, selected_cards):
            orientation = random.choice(["Upright", "Reversed"])
            results.append((pos, card_name, orientation))
            
    return results

def render_reading(querent_name, question, spread_name, cards):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_text = []
    header = f"READING FOR: {querent_name.upper()}\nDATE: {now}\nSPREAD: {spread_name}\n"
    if question:
        header += f"QUESTION: \"{question}\"\n"
    header += "=" * 65 + "\n"
    
    print("\n" + "=" * 65)
    print(header)
    log_text.append(header)
    
    elements_summary = {"Fire": 0, "Water": 0, "Air": 0, "Earth": 0}
    category_summary = {"Major Arcana": 0, "Minor Arcana": 0}
    
    for pos, card, orientation in cards:
        card_data = TAROT_DECK[card]
        category = card_data["Category"]
        meaning = card_data[orientation]
        elem = card_data["Element"]
        zodiac = card_data["Zodiac/Planet"]
        aff = card_data["Affirmation"]
        
        elements_summary[elem] += 1
        category_summary[category] += 1
        
        card_output = (
            f"┌─ POSITION: {pos.upper()}\n"
            f"│  CARD NAME: {card} ({orientation})\n"
            f"│  ARCANA TYPE: [{category.upper()}]\n"
            f"│  CORRESPONDENCE: Element: {elem} | Sign/Suit: {zodiac}\n"
            f"│  INTERPRETATION: {meaning}\n"
            f"│  AFFIRMATION: \"{aff}\"\n"
            f"└" + "─" * 63 + "\n"
        )
        print(card_output)
        log_text.append(card_output)
        time.sleep(0.4)

    summary_head = "READING DYNAMICS & ARCANA BREAKDOWN:\n"
    arcana_body = f"  - Major Arcana Cards: {category_summary['Major Arcana']} (Life Lessons & Spiritual Forces)\n"
    arcana_body += f"  - Minor Arcana Cards: {category_summary['Minor Arcana']} (Daily Circumstances & Practical Actions)\n"
    element_body = "  - Elemental Balance: " + " | ".join([f"{k}: {v}" for k, v in elements_summary.items()]) + "\n"
    
    synthesis = (
        "\nSUMMARY SYNTHESIS:\n"
        "Upright cards represent external energies that are active and flowing.\n"
        "Reversed cards point to internal processing, blocked energy, or introspection.\n"
        "Major Arcana cards signal major life events, while Minor Arcana reflect temporary circumstances.\n"
        + "=" * 65 + "\n"
    )
    
    full_summary = summary_head + arcana_body + element_body + synthesis
    print(full_summary)
    log_text.append(full_summary)
    
    return "".join(log_text)

def save_reading(log_content):
    save = input("Would you like to save this reading to 'ridham_tarot_log.txt'? (y/n): ").strip().lower()
    if save.startswith('y'):
        with open("ridham_tarot_log.txt", "a", encoding="utf-8") as f:
            f.write(log_content + "\n\n")
        print("✓ Reading saved successfully to 'ridham_tarot_log.txt'.")


 ==========================================
 5. MAIN APPLICATION LOOP
 ==========================================

def run_tarot_session():
    print_banner()
    querent_name = input("Enter your name or alias: ").strip() or "Seeker"
    
    while True:
        print("\n" + "-" * 65)
        question = input(f"[{querent_name}] Focus on a question (or press Enter for general reading): ").strip()
        
        positions, spread_name = select_spread()
        cards = draw_cards(positions)
        log_content = render_reading(querent_name, question, spread_name, cards)
        save_reading(log_content)
        
        print("\n" + "-" * 65)
        again = input("Would you like to draw another reading? (y/n): ").strip().lower()
        if not again.startswith('y'):
            print(f"\nFarewell, {querent_name}. May wisdom guide your path! ✨\n")
            break
            
        # Ask if the next reading is for a new user
        is_new_user = input("Is a new person drawing this reading? (y/n): ").strip().lower()
        if is_new_user.startswith('y'):
            querent_name = input("Enter the new user's name or alias: ").strip() or "Seeker"

if __name__ == "__main__":
    run_tarot_session()
