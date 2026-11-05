import type { StoryLine } from './types.ts';

// Verbatim dialogue from docs/story/user-script.txt. Do not rewrite or shorten.
export const STORY_DIALOGUE = {
  "appointment": [
    {
      "id": "appointment-01",
      "text": "Charlie, good to see you.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "welcoming",
        "pose": "greet"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      },
      "nameSlots": "greeting"
    },
    {
      "id": "appointment-02",
      "text": "Thank you, Chief.",
      "sourceSpeaker": "Charlie",
      "speaker": {
        "character": "commander",
        "expression": "grateful",
        "pose": "listen"
      },
      "listener": {
        "character": "chief",
        "expression": "encouraging",
        "pose": "listen"
      }
    },
    {
      "id": "appointment-03",
      "text": "In our last meeting, we made an important decision. You’ve been selected to lead your own space mission as the Commander.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "proud",
        "pose": "explain"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    },
    {
      "id": "appointment-04",
      "text": "My own mission?",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "surprised",
        "pose": "think"
      },
      "listener": {
        "character": "chief",
        "expression": "encouraging",
        "pose": "listen"
      }
    },
    {
      "id": "appointment-05",
      "text": "That’s right. You’ll choose where you want to go, what you want to investigate, and how you’ll prepare your spacecraft and crew.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "confident",
        "pose": "explain"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    },
    {
      "id": "appointment-06",
      "text": "That’s a big responsibility.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "think"
      },
      "listener": {
        "character": "chief",
        "expression": "encouraging",
        "pose": "listen"
      }
    },
    {
      "id": "appointment-07",
      "text": "It is. So, Commander… where do you want to go? Well then, best of luck!!",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "encouraging",
        "pose": "point"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    }
  ],
  "companionIntro": [
    {
      "id": "companionIntro-01",
      "text": "Hey there, little learner! As you can see, I have just received a huge responsibility. I must succeed no matter what!!",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "determined",
        "pose": "ready"
      }
    },
    {
      "id": "companionIntro-02",
      "text": "As one of my closest friends, I want you to help me complete the mission. Don’t worry. I am always here to guide you. Now let’s start with the planet selection!",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "encouraging",
        "pose": "point"
      }
    }
  ],
  "objectiveBriefing": [
    {
      "id": "objectiveBriefing-01",
      "text": "What exactly will we be looking for? Great! Now lets decide what exactly we will be looking for.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "curious",
        "pose": "think"
      }
    },
    {
      "id": "objectiveBriefing-02",
      "text": "That depends on your mission objective. Think carefully.Your objective will determine what location is best, what kind of spacecraft, instruments, rover, power system, and other equipment you’ll need.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "focused",
        "pose": "explain"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    },
    {
      "id": "objectiveBriefing-03",
      "text": "It depends on our mission objective. Think carefully. Our objective will determine what location is best, what kind of spacecraft, instruments, rover, power system, and other equipment we’ll need.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "explain"
      }
    }
  ],
  "siteBriefing": [
    {
      "id": "siteBriefing-01",
      "text": "Now that our mission is fixed, we will choose the landing site.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "confident",
        "pose": "point"
      }
    }
  ],
  "resourceBriefing": [
    {
      "id": "resourceBriefing-01",
      "text": "You’ll have a limited budget, mass, and power supply. Every choice comes with a trade-off.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "focused",
        "pose": "explain"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    },
    {
      "id": "resourceBriefing-02",
      "text": "Then I’d better choose wisely.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "determined",
        "pose": "ready"
      }
    },
    {
      "id": "resourceBriefing-03",
      "text": "That’s what I want to hear. Your mission begins now, Commander. Make every decision count.",
      "sourceSpeaker": "Chief",
      "speaker": {
        "character": "chief",
        "expression": "encouraging",
        "pose": "point"
      },
      "listener": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "listen"
      }
    },
    {
      "id": "resourceBriefing-04",
      "text": "We must remember that we’ll have limited budget, mass, and power supply. Every choice we make, comes with a trade-off.",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "thoughtful",
        "pose": "explain"
      }
    },
    {
      "id": "resourceBriefing-05",
      "text": "Now I thing we are good to go. Let’s dive into the mission, mate!",
      "sourceSpeaker": "Commander",
      "speaker": {
        "character": "commander",
        "expression": "confident",
        "pose": "ready"
      }
    }
  ]
} as const satisfies Record<string, readonly StoryLine[]>;
