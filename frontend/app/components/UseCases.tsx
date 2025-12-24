export default function UseCases() {
  const useCases = [
    {
      title: 'Travel with Friends',
      description: 'Split accommodation, food, and activity costs during group trips. Track expenses in different currencies and tokens.',
      emoji: '✈️',
      color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
    },
    {
      title: 'Shared Living',
      description: 'Manage rent, utilities, and household expenses with roommates. Automatic balance tracking across all members.',
      emoji: '🏠',
      color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
    },
    {
      title: 'Team Events',
      description: 'Organize office parties, team dinners, or group activities. Transparent expense tracking for everyone.',
      emoji: '🎉',
      color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
    },
    {
      title: 'Family Gatherings',
      description: 'Share costs for family reunions, celebrations, or regular get-togethers. Simple and fair splitting.',
      emoji: '👨‍👩‍👧‍👦',
      color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
    },
    {
      title: 'Project Collaboration',
      description: 'Split costs for shared resources, tools, or subscriptions in collaborative projects and DAOs.',
      emoji: '💼',
      color: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900',
    },
    {
      title: 'Regular Subscriptions',
      description: 'Share streaming services, software licenses, or any recurring expenses with friends or colleagues.',
      emoji: '📱',
      color: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900',
    },
  ];

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-zinc-900 dark:text-white">
          Perfect For Every Occasion
        </h2>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-16 text-lg">
          Whether it's a trip, shared living, or team events, SplitWise has you covered
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl border ${useCase.color} hover:shadow-xl transition-all`}
            >
              <div className="text-5xl mb-4">{useCase.emoji}</div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">
                {useCase.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}