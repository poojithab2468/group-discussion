export const MOTIVATIONAL_QUOTES = [
  { text: "The art of communication is the language of leadership.", author: "James Humes" },
  { text: "Speak clearly, if you speak at all; carve every word before you let it fall.", author: "Oliver Wendell Holmes" },
  { text: "The more you practice, the better you get, the more freedom you have to create.", author: "Jocko Willink" },
  { text: "Communication works for those who work at it.", author: "John Powell" },
  { text: "Your voice is your superpower. Use it wisely.", author: "Unknown" },
  { text: "Great speakers are not born, they are trained.", author: "Dale Carnegie" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "What we think, we become. What we speak, we attract.", author: "Buddha" },
  { text: "A good discussion increases the dimensions of everyone who takes part.", author: "Randolph Bourne" },
  { text: "The tongue is the only instrument that gets sharper with use.", author: "Washington Irving" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "Practice isn't the thing you do once you're good. It's what makes you good.", author: "Malcolm Gladwell" },
  { text: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
  { text: "Confidence comes not from always being right but from not fearing to be wrong.", author: "Peter T. McIntyre" },
];

export function getDailyQuote(): { text: string; author: string } {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
