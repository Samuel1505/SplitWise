interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

export default function FeatureCard({ icon, title, description, gradientFrom, gradientTo }: FeatureCardProps) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

