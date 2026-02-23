export type InputMode = 'text' | 'voice';

export interface PracticeEntry {
  id: string;
  text: string;
  inputMode: InputMode;
  analysis: string | null;
  wordCount: number;
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  title: string;
  description: string;
  category: SessionCategory;
  topic: string;
  entries: PracticeEntry[];
  createdAt: string;
  lastPracticedAt: string | null;
}

export type SessionCategory =
  | 'current_affairs'
  | 'technology'
  | 'social_issues'
  | 'business'
  | 'abstract'
  | 'case_study';

export const CATEGORY_CONFIG: Record<SessionCategory, { label: string; color: string; emoji: string }> = {
  current_affairs: { label: 'Current Affairs', color: '#E05A47', emoji: '📰' },
  technology: { label: 'Technology', color: '#2E8B82', emoji: '💻' },
  social_issues: { label: 'Social Issues', color: '#3A7FD5', emoji: '🤝' },
  business: { label: 'Business & Economy', color: '#D4951E', emoji: '📊' },
  abstract: { label: 'Abstract Topics', color: '#8B5CF6', emoji: '💡' },
  case_study: { label: 'Case Study', color: '#059669', emoji: '📋' },
};

export const GD_TOPICS: Record<SessionCategory, string[]> = {
  current_affairs: [
    'Is social media a boon or bane for democracy?',
    'Should AI be regulated by governments?',
    'Climate change: Individual vs collective responsibility',
    'Is remote work the future or a temporary trend?',
    'Should voting be made mandatory?',
  ],
  technology: [
    'Will AI replace human creativity?',
    'Is data privacy a myth in the digital age?',
    'Blockchain beyond cryptocurrency - practical applications',
    'Should coding be a mandatory school subject?',
    'Electric vehicles: Ready for mass adoption?',
  ],
  social_issues: [
    'Is reservation system still relevant?',
    'Gender pay gap: Myth or reality?',
    'Should education be completely free?',
    'Mental health awareness in workplaces',
    'Is cancel culture beneficial for society?',
  ],
  business: [
    'Startups vs corporate jobs - which is better?',
    'Should companies prioritize profit or social impact?',
    'Is globalization beneficial for developing nations?',
    'Gig economy: Exploitation or empowerment?',
    'Should cryptocurrency replace traditional banking?',
  ],
  abstract: [
    'Is perfection the enemy of progress?',
    'Does success require failure?',
    'Is competition necessary for growth?',
    'Knowledge is power - do you agree?',
    'Is there a thin line between confidence and arrogance?',
  ],
  case_study: [
    'A company faces declining market share despite quality products',
    'Should a startup pivot or persist with its original idea?',
    'Balancing employee welfare with business profitability',
    'Expanding into international markets vs strengthening domestic presence',
    'Handling a PR crisis in the age of social media',
  ],
};
