export default function Statistics() {
  const stats = [
    {
      number: '10K+',
      label: 'Active Users',
      icon: '👥',
    },
    {
      number: '$2M+',
      label: 'Expenses Tracked',
      icon: '💰',
    },
    {
      number: '50K+',
      label: 'Transactions',
      icon: '🔄',
    },
    {
      number: '99.9%',
      label: 'Uptime',
      icon: '⚡',
    },
  ];

  return (
    <section className="container mx-auto px-6 py-16 border-y border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}