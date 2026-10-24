/* ==========================================================================
   VocabSolitaire — Vocabulary decks & game configuration
   Each deck: 4 categories × 5 words = 20 shuffled cards.
   ========================================================================== */

const VOCAB_CONFIG = {
  decks: [
    {
      id: "starter",
      emoji: "🎴",
      name: "Starter Basics",
      tagline: "Classic everyday categories — perfect first shuffle.",
      categories: [
        { id: "animals", name: "Animals", icon: "🐾" },
        { id: "food", name: "Food", icon: "🍴" },
        { id: "transport", name: "Transportation", icon: "✈️" },
        { id: "clothing", name: "Clothing", icon: "👕" }
      ],
      words: [
        { word: "Dog", category: "animals" },
        { word: "Cat", category: "animals" },
        { word: "Horse", category: "animals" },
        { word: "Lion", category: "animals" },
        { word: "Elephant", category: "animals" },

        { word: "Rice", category: "food" },
        { word: "Banana", category: "food" },
        { word: "Bread", category: "food" },
        { word: "Cheese", category: "food" },
        { word: "Apple", category: "food" },

        { word: "Car", category: "transport" },
        { word: "Airplane", category: "transport" },
        { word: "Bus", category: "transport" },
        { word: "Train", category: "transport" },
        { word: "Bicycle", category: "transport" },

        { word: "Shoes", category: "clothing" },
        { word: "Jacket", category: "clothing" },
        { word: "Shirt", category: "clothing" },
        { word: "Hat", category: "clothing" },
        { word: "Dress", category: "clothing" }
      ]
    },
    {
      id: "everyday",
      emoji: "🏡",
      name: "Everyday Life",
      tagline: "Words from the places and moments of a normal day.",
      categories: [
        { id: "home", name: "At Home", icon: "🏠" },
        { id: "school", name: "School", icon: "🎓" },
        { id: "sports", name: "Sports", icon: "⚽" },
        { id: "weather", name: "Weather", icon: "🌤️" }
      ],
      words: [
        { word: "Table", category: "home" },
        { word: "Window", category: "home" },
        { word: "Pillow", category: "home" },
        { word: "Kitchen", category: "home" },
        { word: "Garden", category: "home" },

        { word: "Pencil", category: "school" },
        { word: "Teacher", category: "school" },
        { word: "Library", category: "school" },
        { word: "Homework", category: "school" },
        { word: "Ruler", category: "school" },

        { word: "Soccer", category: "sports" },
        { word: "Tennis", category: "sports" },
        { word: "Swimming", category: "sports" },
        { word: "Boxing", category: "sports" },
        { word: "Marathon", category: "sports" },

        { word: "Rain", category: "weather" },
        { word: "Snow", category: "weather" },
        { word: "Cloud", category: "weather" },
        { word: "Storm", category: "weather" },
        { word: "Sunshine", category: "weather" }
      ]
    },
    {
      id: "nature",
      emoji: "🔬",
      name: "Nature & Science",
      tagline: "From the garden to the galaxy — a curious mix.",
      categories: [
        { id: "plants", name: "Plants", icon: "🌱" },
        { id: "space", name: "Space", icon: "🚀" },
        { id: "ocean", name: "Ocean", icon: "🌊" },
        { id: "body", name: "Human Body", icon: "💪" }
      ],
      words: [
        { word: "Flower", category: "plants" },
        { word: "Tree", category: "plants" },
        { word: "Leaf", category: "plants" },
        { word: "Root", category: "plants" },
        { word: "Seed", category: "plants" },

        { word: "Planet", category: "space" },
        { word: "Star", category: "space" },
        { word: "Rocket", category: "space" },
        { word: "Moon", category: "space" },
        { word: "Comet", category: "space" },

        { word: "Shark", category: "ocean" },
        { word: "Whale", category: "ocean" },
        { word: "Coral", category: "ocean" },
        { word: "Dolphin", category: "ocean" },
        { word: "Wave", category: "ocean" },

        { word: "Heart", category: "body" },
        { word: "Brain", category: "body" },
        { word: "Muscle", category: "body" },
        { word: "Finger", category: "body" },
        { word: "Shoulder", category: "body" }
      ]
    },
    {
      id: "leisure",
      emoji: "🎭",
      name: "Work & Leisure",
      tagline: "Professions, feelings, music and travel.",
      categories: [
        { id: "jobs", name: "Jobs", icon: "💼" },
        { id: "emotions", name: "Emotions", icon: "😊" },
        { id: "music", name: "Music", icon: "🎵" },
        { id: "travel", name: "Travel", icon: "🧳" }
      ],
      words: [
        { word: "Doctor", category: "jobs" },
        { word: "Farmer", category: "jobs" },
        { word: "Pilot", category: "jobs" },
        { word: "Chef", category: "jobs" },
        { word: "Lawyer", category: "jobs" },

        { word: "Happy", category: "emotions" },
        { word: "Angry", category: "emotions" },
        { word: "Surprised", category: "emotions" },
        { word: "Nervous", category: "emotions" },
        { word: "Proud", category: "emotions" },

        { word: "Guitar", category: "music" },
        { word: "Piano", category: "music" },
        { word: "Drum", category: "music" },
        { word: "Violin", category: "music" },
        { word: "Singer", category: "music" },

        { word: "Passport", category: "travel" },
        { word: "Hotel", category: "travel" },
        { word: "Airport", category: "travel" },
        { word: "Suitcase", category: "travel" },
        { word: "Map", category: "travel" }
      ]
    }
  ]
};

const GAME_CONFIG = {
  storageKeys: {
    sound: "vocabsolitaire.sound",
    deck: "vocabsolitaire.deck"
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { VOCAB_CONFIG, GAME_CONFIG };
}
